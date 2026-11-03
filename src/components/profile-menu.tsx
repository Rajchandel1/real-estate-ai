'use client';
import Link from 'next/link';
import {useWorkspace} from '@/store/workspace';
import {LogoutButton} from './logout-button';
export function ProfileMenu({compact=false}:{compact?:boolean}){
 const {db,busy,error}=useWorkspace();return <details className={'profile-menu'+(compact?' compact':'')}><summary aria-label="Open profile menu"><span className="avatar">{db.broker.name.slice(0,2).toUpperCase()}</span>{!compact&&<span><b>{db.broker.name}</b><small>Profile & account</small></span>}</summary><div className="profile-menu-panel"><b>{db.broker.name}</b><Link href="/app/settings">Agency settings</Link>{busy&&<small>Syncing changes…</small>}<LogoutButton disabled={busy} unsaved={!!error}/></div></details>;
}
