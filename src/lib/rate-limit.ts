import 'server-only';
import {createHmac} from 'node:crypto';
import type {PoolClient} from 'pg';
import {headers} from 'next/headers';
export async function requestFingerprint(){
 const h=await headers();
 // Only trust forwarding headers on hosts that sanitize them.
 const ip=process.env.VERCEL?(h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown'):process.env.TRUST_PROXY==='true'?(h.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'):'untrusted';
 const secret=process.env.RATE_LIMIT_SECRET;
 if(process.env.NODE_ENV==='production'&&!secret)throw Error('Public forms are temporarily unavailable');
 return createHmac('sha256',secret||'local-development-only').update(ip).digest('hex');
}
export async function consumeLimit(c:PoolClient,key:string,limit:number,seconds=600){
 const {rows}=await c.query<{count:number}>(`insert into public.rate_limits(key,window_start,count) values($1,now(),1) on conflict(key) do update set count=case when rate_limits.window_start<now()-make_interval(secs=>$2) then 1 else rate_limits.count+1 end,window_start=case when rate_limits.window_start<now()-make_interval(secs=>$2) then now() else rate_limits.window_start end returning count`,[key,seconds]);
 if(rows[0].count>limit)throw Error('Too many requests. Please try again later.');
}
export async function verifyCaptcha(token:string){
 const secret=process.env.TURNSTILE_SECRET_KEY;
 if(!secret){if(process.env.NODE_ENV==='production')throw Error('Public forms are temporarily unavailable');return}
 if(!token)throw Error('Complete the security check');
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret,response:token}),signal:AbortSignal.timeout(8000)});
 const result=await response.json();if(!response.ok||!result.success)throw Error('Security check failed. Please try again.');
 if(process.env.APP_ORIGIN&&result.hostname!==new URL(process.env.APP_ORIGIN).hostname)throw Error('Invalid security check origin');
}
