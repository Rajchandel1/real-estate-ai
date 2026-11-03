import {redirect} from 'next/navigation';
import {createSupabaseServer} from '@/lib/supabase/server';
import {LoginCard} from '@/components/login-card';
export const metadata={robots:{index:false,follow:false}};
export default async function Page(){const sb=await createSupabaseServer();const {data:{user}}=await sb.auth.getUser();if(user)redirect('/app/properties');let googleEnabled=true;try{const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok){const settings=await response.json();googleEnabled=settings.external?.google===true}}catch{}return <main className="auth-page"><div><LoginCard googleEnabled={googleEnabled}/>{!googleEnabled&&<p className="auth-error" role="status">Google sign-in is not configured yet. Please contact your agency administrator.</p>}</div></main>}
