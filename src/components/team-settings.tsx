'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {listTeam,setTeamMember} from '@/app/actions/team';
import {Button} from './ui';
export function TeamSettings(){
 const [members,setMembers]=useState<Awaited<ReturnType<typeof listTeam>>>([]),[email,setEmail]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[owner,setOwner]=useState(false);
 useEffect(()=>{listTeam().then(v=>{setMembers(v);setOwner(true)}).catch(()=>{})},[]);
 async function change(email:string,active:boolean){setBusy(true);setError('');try{await setTeamMember({email,active});setMembers(await listTeam());setEmail('')}catch(e){setError(e instanceof Error?e.message:'Could not update team')}finally{setBusy(false)}}
 if(!owner)return null;
 return <section className="card panel"><h3>Agency team</h3><p>Ask your agent to sign in with Google once, then grant access using their email.</p><form onSubmit={(e:FormEvent)=>{e.preventDefault();void change(email,true)}} className="row gap"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="agent@example.com"/><Button type="submit" disabled={busy}>Grant agent access</Button></form>{error&&<p role="alert">{error}</p>}<ul>{members.map(m=><li key={m.userId}>{m.email} · {m.role} · {m.active?'Active':'Revoked'} {m.role!=='owner'&&<Button disabled={busy} variant="secondary" onClick={()=>void change(m.email,!m.active)}>{m.active?'Revoke':'Restore'}</Button>}</li>)}</ul></section>;
}
