'use server';
import {z} from 'zod';
import {pool} from '@/lib/db';
import {requireOwner} from '@/lib/authz';
export async function listTeam(){const {agencyId}=await requireOwner();const {rows}=await pool.query<{userId:string;email:string;role:string;active:boolean}>(`select m.user_id as "userId",u.email,m.role,m.active from public.agency_memberships m join auth.users u on u.id=m.user_id where m.agency_id=$1 order by m.role,u.email`,[agencyId]);return rows}
export async function setTeamMember(input:{email:string;active:boolean}){
 const {agencyId,userId}=await requireOwner(),data=z.object({email:z.string().email().max(120),active:z.boolean()}).parse(input),c=await pool.connect();
 try{await c.query('BEGIN');await c.query('select id from public.agencies where id=$1 for update',[agencyId]);
 const user=await c.query<{id:string}>('select id from auth.users where lower(email)=lower($1) and email_confirmed_at is not null',[data.email]);if(!user.rows[0])throw Error('This person must sign in with Google once before you can grant access');
 if(user.rows[0].id===userId)throw Error('You cannot revoke your own access');
 const member=await c.query('select role from public.agency_memberships where user_id=$1 and agency_id=$2',[user.rows[0].id,agencyId]);if(member.rows[0]?.role==='owner')throw Error('Owner access cannot be changed here');
 await c.query("insert into public.agency_memberships(user_id,agency_id,role,active) values($1,$2,'agent',$3) on conflict(user_id,agency_id) do update set active=excluded.active",[user.rows[0].id,agencyId,data.active]);
 await c.query("insert into public.audit_events(agency_id,actor_id,action,details) values($1,$2,'membership.updated',$3::jsonb)",[agencyId,userId,JSON.stringify({memberId:user.rows[0].id,active:data.active})]);await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
