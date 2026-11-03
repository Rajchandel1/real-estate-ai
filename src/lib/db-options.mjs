import {readFileSync} from 'node:fs';
import path from 'node:path';

export function databasePoolOptions(env=process.env){
 if(!env.DATABASE_URL)throw Error('DATABASE_URL is missing');
 const url=new URL(env.DATABASE_URL);
 // pg connection-string SSL options replace the explicit TLS configuration.
 // Keep verification controlled here, including when dashboard URLs specify sslmode.
 for(const name of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(name);
 const isSupabase=url.hostname.endsWith('.supabase.co')||url.hostname.endsWith('.supabase.com');
 const ca=env.DATABASE_CA_CERT?.replace(/\\n/g,'\n')||(isSupabase?readFileSync(path.join(process.cwd(),'certs','supabase-ca.crt'),'utf8'):undefined);
 return {connectionString:url.toString(),max:5,connectionTimeoutMillis:8000,idleTimeoutMillis:10000,statement_timeout:10000,
  ssl:env.DATABASE_SSL==='disable'&&env.NODE_ENV!=='production'?false:{rejectUnauthorized:true,...(ca?{ca}:{})}};
}
