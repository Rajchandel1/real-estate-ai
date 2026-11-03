'use server';
import {z} from 'zod';
import {createHash,randomUUID} from 'node:crypto';
import {pool} from '@/lib/db';
import {revalidatePath} from 'next/cache';
import {slugSchema,phoneSchema,daySchema,timeSchema,visitIsFuture,leadSchema,visitSchema} from '@/lib/validation';
import {fromRow,upsertRecord} from '@/lib/records';
import type {Property,Lead} from '@/lib/types';
import {requestFingerprint,consumeLimit,verifyCaptcha} from '@/lib/rate-limit';
const schema=z.object({slug:slugSchema,name:z.string().trim().min(2).max(100),phone:phoneSchema,email:z.string().email().max(120).optional().or(z.literal('')),notes:z.string().max(1200),propertyId:z.string().min(1).max(100).optional(),mode:z.enum(['enquiry','visit']),date:daySchema.optional(),time:timeSchema.optional(),submissionId:z.string().uuid(),captchaToken:z.string().max(4096).default(''),consent:z.literal(true)}).strict();
export async function submitBuyerEnquiry(data:z.input<typeof schema>){
 const parsed=schema.safeParse(data);if(!parsed.success)throw Error(parsed.error.issues[0]?.message||'Invalid enquiry');const d=parsed.data;
 if(d.mode==='visit'&&(!d.propertyId||!d.date||!d.time))throw Error('Select a property, date and time');
 const fingerprint=await requestFingerprint(),c=await pool.connect();
 try{
  const agency=await c.query<{id:string;timezone:string}>('select id,timezone from public.agencies where slug=$1',[d.slug]);if(!agency.rows[0])throw Error('Agency not found');const agencyId=agency.rows[0].id;
  const phone=d.phone.replace(/\D/g,''),hash=(v:string)=>createHash('sha256').update(v).digest('hex');
  const requestHash=hash(JSON.stringify({slug:d.slug,name:d.name,phone,email:d.email||'',notes:d.notes,propertyId:d.propertyId,mode:d.mode,date:d.date,time:d.time}));
  const duplicate=await c.query<{request_hash:string}>('select request_hash from public.public_submissions where agency_id=$1 and id=$2',[agencyId,d.submissionId]);
  if(duplicate.rows[0]){if(duplicate.rows[0].request_hash!==requestHash)throw Error('This submission ID was already used');return {ok:true as const,duplicate:true}}
  await consumeLimit(c,'enquiry:ip:'+fingerprint,20);await consumeLimit(c,'enquiry:agency:'+agencyId,200);
  await verifyCaptcha(d.captchaToken);
  await c.query('BEGIN');
  await c.query('select id from public.agencies where id=$1 for update',[agencyId]);
  const repeated=await c.query<{request_hash:string}>('select request_hash from public.public_submissions where agency_id=$1 and id=$2',[agencyId,d.submissionId]);
  if(repeated.rows[0]){if(repeated.rows[0].request_hash!==requestHash)throw Error('This submission ID was already used');await c.query('COMMIT');return {ok:true,duplicate:true}}
  const phoneHash=hash(agencyId+':'+phone);
  const recent=await c.query<{total:string}>("select count(*)::text total from public.public_submissions where agency_id=$1 and phone_hash=$2 and created_at>now()-interval '10 minutes'",[agencyId,phoneHash]);if(Number(recent.rows[0]?.total)>=4)throw Error('Too many requests. Please try again later.');
  let property:Property|undefined;
  if(d.propertyId){const p=await c.query("select * from public.properties where agency_id=$1 and id=$2 and status='Active'",[agencyId,d.propertyId]);if(!p.rows[0])throw Error('Property unavailable');property=fromRow<Property>(p.rows[0])}
  const existing=await c.query('select * from public.leads where agency_id=$1 and phone=$2 order by created_at limit 1',[agencyId,phone]);
  const lead=existing.rows[0]?fromRow<Lead>(existing.rows[0]):{id:randomUUID(),name:d.name,phone,email:d.email||'',status:'New' as const,source:'Website',purpose:property?.purpose||'sale' as const,budget:property?'Property enquiry':'Flexible',location:property?.location||'Any',type:property?.type||'Any',bhk:String(property?.bhk||'Any'),interests:[],notes:'',createdAt:new Date().toISOString()};
  if(property&&!lead.interests.includes(property.id))lead.interests.push(property.id);lead.notes=[lead.notes,d.notes].filter(Boolean).join('\n').slice(-10000);
  await upsertRecord(c,'leads',agencyId,leadSchema.parse(lead));
  if(d.mode==='visit'){
   if(!visitIsFuture(d.date!,d.time!,agency.rows[0].timezone))throw Error('Choose a future visit time');
   const collision=await c.query("select 1 from public.visits where agency_id=$1 and property_id=$2 and date=$3 and time=$4 and status in ('Requested','Confirmed')",[agencyId,property!.id,d.date,d.time]);if(collision.rowCount)throw Error('Visit slot unavailable');
   await upsertRecord(c,'visits',agencyId,visitSchema.parse({id:randomUUID(),leadId:lead.id,propertyId:property!.id,date:d.date,time:d.time,status:'Requested',createdAt:new Date().toISOString()}));
  }
  await c.query('insert into public.public_submissions(agency_id,id,phone_hash,request_hash) values($1,$2,$3,$4)',[agencyId,d.submissionId,phoneHash,requestHash]);
  await c.query('update public.agencies set revision=revision+1,updated_at=now() where id=$1',[agencyId]);
  await c.query("insert into public.audit_events(agency_id,action,details) values($1,'enquiry.received',$2::jsonb)",[agencyId,JSON.stringify({leadId:lead.id,mode:d.mode,consent:true})]);
  await c.query('COMMIT');revalidatePath('/app','layout');return {ok:true as const,duplicate:false};
 }catch(e){await c.query('ROLLBACK');const code=(e as {code?:string}).code;if(code)console.error('Enquiry failed',{code});return {ok:false as const,error:code==='23505'?'Visit slot unavailable':code?'Could not send enquiry. Please try again.':e instanceof Error?e.message:'Could not send enquiry'}}finally{c.release()}
}
