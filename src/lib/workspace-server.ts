import 'server-only';
import {pool} from '@/lib/db';
import type {Workspace,Broker,Property} from '@/lib/types';
import {requireAgency} from '@/lib/authz';
import {workspaceSchema,visitIsFuture} from './validation';
import {readRecords,syncRecords,fromRow} from './records';
import {cache} from 'react';
export async function readPrivateWorkspace(){
 const {agencyId}=await requireAgency(),c=await pool.connect();
 try{await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const result=await c.query<{broker:Broker;revision:number}>('select broker,revision from public.agencies where id=$1',[agencyId]);
 const row=result.rows[0];if(!row)throw Error('Agency not found');const records=await readRecords(c,agencyId);await c.query('COMMIT');return {payload:{version:2 as const,broker:row.broker,...records},revision:row.revision};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
export async function writePrivateWorkspace(payload:Workspace,revision:number){
 const member=await requireAgency();if(!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid revision');
 const parsed=workspaceSchema.safeParse(payload);if(!parsed.success)throw Error(parsed.error.issues[0]?.message||'Invalid workspace');const valid=parsed.data;
 valid.leads=valid.leads.map(lead=>({...lead,phone:lead.phone.replace(/\D/g,'')}));
 if(Buffer.byteLength(JSON.stringify(valid))>3_000_000)throw Error('Workspace too large. Reduce the import size.');
 if(valid.broker.slug!==member.slug)throw Error('Agency address cannot be changed through a workspace save');
 const c=await pool.connect();try{await c.query('BEGIN');const {rows}=await c.query<{broker:Broker;revision:number}>('select broker,revision from public.agencies where id=$1 for update',[member.agencyId]);
 if(rows[0]?.revision!==revision)throw Error('CONFLICT: Workspace changed on another device. Reload before saving.');
 const old:Workspace={version:2,broker:rows[0].broker,...await readRecords(c,member.agencyId)};
 if(member.role!=='owner'&&(JSON.stringify(valid.broker)!==JSON.stringify(old.broker)||(['properties','leads','visits'] as const).some(t=>old[t].some(x=>!valid[t].some(y=>y.id===x.id)))))throw Error('Only the owner can change branding or remove records');
 for(const v of valid.visits){const previous=old.visits.find(x=>x.id===v.id);if(['Requested','Confirmed'].includes(v.status)&&(!previous||v.date!==previous.date||v.time!==previous.time||!['Requested','Confirmed'].includes(previous.status))){if(!visitIsFuture(v.date,v.time,member.timeZone))throw Error('Visit must be in the future');if(!valid.properties.some(p=>p.id===v.propertyId&&p.status==='Active'))throw Error('Property unavailable')}}
 await syncRecords(c,member.agencyId,old,valid);
 const result=await c.query<{revision:number}>('update public.agencies set broker=$1::jsonb,revision=revision+1,updated_at=now() where id=$2 returning revision',[JSON.stringify(valid.broker),member.agencyId]);
 await c.query('insert into public.audit_events(agency_id,actor_id,action,details) values($1,$2,$3,$4::jsonb)',[member.agencyId,member.userId,'workspace.updated',JSON.stringify({revision:result.rows[0].revision,counts:{properties:valid.properties.length,leads:valid.leads.length,visits:valid.visits.length}})]);
 await c.query('COMMIT');return result.rows[0].revision;
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
export const readPublicWorkspace=cache(async(slug:string)=>{
 const agency=await pool.query<{id:string;broker:Broker}>('select id,broker from public.agencies where slug=$1',[slug]);if(!agency.rows[0])return null;
 const {id,broker}=agency.rows[0];const result=await pool.query("select * from public.properties where agency_id=$1 and status='Active' order by featured desc,created_at desc limit 1000",[id]);
 return {version:2,broker:{...broker,slug},properties:result.rows.map(r=>fromRow<Property>(r)),leads:[],visits:[]} satisfies Workspace;
});
export const readPublicProperty=cache(async(slug:string,propertyId:string)=>{
 if(!/^[a-z0-9-]{2,80}$/.test(slug)||propertyId.length>100)return null;
 const result=await pool.query("select p.*,a.broker,a.slug from public.properties p join public.agencies a on a.id=p.agency_id where a.slug=$1 and p.id=$2 and p.status='Active'",[slug,propertyId]);
 if(!result.rows[0])return null;const {broker,slug:agencySlug,...row}=result.rows[0];
 return {version:2,broker:{...broker,slug:agencySlug},properties:[fromRow<Property>(row)],leads:[],visits:[]} satisfies Workspace;
});
