import 'server-only';
import {createSupabaseServer} from '@/lib/supabase/server';
import {pool} from '@/lib/db';
import {emptyWorkspace} from './empty-workspace';
import {slugSchema} from './validation';
export async function requireIdentity(){
 const sb=await createSupabaseServer();const {data:{user},error}=await sb.auth.getUser();
 if(error||!user||!user.email)throw new Error('UNAUTHENTICATED');
 return user;
}
export async function requireAgency(){
 const user=await requireIdentity();
 const {rows}=await pool.query<{agency_id:string;role:'owner'|'agent';slug:string;timezone:string}>(`select m.agency_id,m.role,a.slug,a.timezone from public.agency_memberships m join public.agencies a on a.id=m.agency_id where m.user_id=$1 and m.active=true order by a.created_at limit 1`,[user.id]);
 if(rows[0])return {agencyId:rows[0].agency_id,userId:user.id,role:rows[0].role,slug:rows[0].slug,timeZone:rows[0].timezone};
 if(user.email?.toLowerCase()!==process.env.CRM_OWNER_EMAIL?.trim().toLowerCase())throw new Error('NOT_A_MEMBER');
 const slug=slugSchema.parse(process.env.AGENCY_SLUG||'my-agency');
 const client=await pool.connect();try{await client.query('BEGIN');
 const org=await client.query<{id:string}>(`insert into public.agencies(slug,broker) values($1,$2::jsonb) on conflict(slug) do update set slug=excluded.slug returning id`,[slug,JSON.stringify(emptyWorkspace(slug).broker)]);
 // Bootstrap must not re-activate a revoked membership or take over an existing owner's agency.
 const owners=await client.query('select 1 from public.agency_memberships where agency_id=$1 limit 1',[org.rows[0].id]);
 if(owners.rowCount)throw Error('NOT_A_MEMBER');
 await client.query(`insert into public.agency_memberships(user_id,agency_id,role) values($1,$2,'owner')`,[user.id,org.rows[0].id]);
 await client.query('COMMIT');return {agencyId:org.rows[0].id,userId:user.id,role:'owner' as const,slug,timeZone:'Asia/Kolkata'};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
export async function requireOwner(){const member=await requireAgency();if(member.role!=='owner')throw Error('Owner permission required');return member}
