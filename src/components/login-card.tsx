'use client';
import {useState} from 'react';
import {createSupabaseBrowser} from '@/lib/supabase/browser';
export function LoginCard({googleEnabled=true}:{googleEnabled?:boolean}){const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function login(){if(busy)return;setBusy(true);setError('');try{
 if(!googleEnabled)throw Error('Google sign-in is not available yet. Please contact the agency administrator.');
 const {error}=await createSupabaseBrowser().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/auth/callback`}});
 if(error)throw error;
 }catch(e){setError(e instanceof Error?e.message:'Sign in failed');setBusy(false)}}
 return <section className="auth-card"><div className="auth-logo">f.</div><h1>Welcome to Forma</h1><p>Sign in with your approved Google account to access the CRM.</p><button type="button" className="auth-google-button" disabled={busy||!googleEnabled} onClick={login}><span className="google-g">G</span>{busy?'Redirecting to Google…':'Continue with Google'}</button>{error&&<p role="alert" className="auth-error">{error}</p>}<small>Broker workspaces are private. The buyer catalogue stays public.</small></section>;
}
