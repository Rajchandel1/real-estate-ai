import {NextRequest,NextResponse} from 'next/server';
import {createSupabaseServer} from '@/lib/supabase/server';
export async function GET(request:NextRequest){
 const url=new URL(request.url);const code=url.searchParams.get('code');
 if(code){const sb=await createSupabaseServer();const {error}=await sb.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/app/properties',url.origin))}
 return NextResponse.redirect(new URL('/login?error=oauth',url.origin));
}
