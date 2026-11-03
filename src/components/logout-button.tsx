'use client';
import {useState} from 'react';
import {createSupabaseBrowser} from '@/lib/supabase/browser';
export function LogoutButton({disabled=false,unsaved=false}:{disabled?:boolean;unsaved?:boolean}){const [busy,setBusy]=useState(false);return <button disabled={busy||disabled} className="btn secondary" onClick={async()=>{if(unsaved&&!window.confirm('You have unsaved changes. Sign out anyway?'))return;setBusy(true);try{await createSupabaseBrowser().auth.signOut();location.assign('/login')}catch{setBusy(false)}}}>{busy?'Signing out…':'Sign out'}</button>}
