import 'server-only';
import {cookies} from 'next/headers';
import {createServerClient,type CookieOptions} from '@supabase/ssr';
export async function createSupabaseServer(){
 const cookieStore=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
  cookies:{getAll(){return cookieStore.getAll()},setAll(items:{name:string;value:string;options:CookieOptions}[]){try{items.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{/* Server Components are read-only; middleware handles refresh. */}}}
 });
}
