import type {PoolClient} from 'pg';
import type {Workspace,Property,Lead,Visit} from './types';

export type EntityTable='properties'|'leads'|'visits';
const snake=(s:string)=>s.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const camel=(s:string)=>s.replace(/_([a-z])/g,(_,c:string)=>c.toUpperCase());
export function fromRow<T>(row:Record<string,unknown>):T{
 const result:Record<string,unknown>={};
 for(const [key,value] of Object.entries(row)){if(key==='agency_id'||value===null)continue;result[camel(key)]=value instanceof Date?(key==='date'?value.toISOString().slice(0,10):value.toISOString()):value}
 return result as T;
}
export async function readRecords(c:PoolClient,agencyId:string){
 const properties=await c.query('select * from public.properties where agency_id=$1 order by created_at desc,id',[agencyId]);
 const leads=await c.query('select * from public.leads where agency_id=$1 order by created_at desc,id',[agencyId]);
 const visits=await c.query("select *,date::text as date from public.visits where agency_id=$1 order by created_at desc,id",[agencyId]);
 return {properties:properties.rows.map(r=>fromRow<Property>(r)),leads:leads.rows.map(r=>fromRow<Lead>(r)),visits:visits.rows.map(r=>fromRow<Visit>(r))};
}
export async function upsertRecord(c:PoolClient,table:EntityTable,agencyId:string,item:Property|Lead|Visit){
 // Only schema-validated records reach this adapter. Identifiers come from a fixed union / object schema.
 const record:Record<string,unknown>={agency_id:agencyId};for(const [k,v] of Object.entries(item))if(v!==undefined)record[snake(k)]=v;
 if(table==='properties')for(const key of ['carpet_area','floor_number','total_floors'])if(!(key in record))record[key]=null;
 const keys=Object.keys(record),columns=keys.map(k=>'"'+k+'"').join(','),updates=keys.filter(k=>!['id','agency_id'].includes(k)).map(k=>`"${k}"=excluded."${k}"`).join(',');
 // jsonb_populate_record correctly decodes arrays, timestamps and nullable fields.
 await c.query(`insert into public.${table} (${columns}) select ${columns} from jsonb_populate_record(null::public.${table},$1::jsonb) on conflict(agency_id,id) do update set ${updates}`,[JSON.stringify(record)]);
}
export async function syncRecords(c:PoolClient,agencyId:string,old:Workspace,next:Workspace){
 const beforeVisits=new Map(old.visits.map(v=>[v.id,JSON.stringify(v)]));
 const changedVisits=next.visits.filter(v=>beforeVisits.get(v.id)!==JSON.stringify(v)).map(v=>v.id);
 // Reinsert changed visits after parents exist; this also permits atomic slot swaps.
 await c.query('delete from public.visits where agency_id=$1 and id=any($2::text[])',[agencyId,changedVisits]);
 // Delete dependants first, then upsert parents before dependants.
 for(const table of ['visits','leads','properties'] as const){const ids=next[table].map(x=>x.id);await c.query(`delete from public.${table} where agency_id=$1 and not(id=any($2::text[]))`,[agencyId,ids])}
 for(const table of ['properties','leads','visits'] as const){const before=new Map<string,string>(old[table].map(x=>[x.id,JSON.stringify(x)]));for(const item of next[table])if(before.get(item.id)!==JSON.stringify(item))await upsertRecord(c,table,agencyId,item)}
}
