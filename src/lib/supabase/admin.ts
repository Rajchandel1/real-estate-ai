import 'server-only';
import {createClient} from '@supabase/supabase-js';
export function createSupabaseAdmin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Error('Storage is not configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
