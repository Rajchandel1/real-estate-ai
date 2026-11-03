import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('@next/env').loadEnvConfig(process.cwd());
const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','DATABASE_URL','SUPABASE_SECRET_KEY','CRM_OWNER_EMAIL','AGENCY_SLUG'];
if(process.argv.includes('--production'))required.push('APP_ORIGIN','NEXT_PUBLIC_TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','RATE_LIMIT_SECRET');
const missing=required.filter(name=>!process.env[name]||/YOUR_|URL_ENCODED_PASSWORD/.test(process.env[name]));
if(missing.length){console.error('Missing configuration: '+missing.join(', '));process.exit(1)}
if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname!=='huusdwrwsmlrqrwsgvfv.supabase.co'){console.error('Supabase project does not match the confirmed project');process.exit(1)}
if(process.argv.includes('--production')&&new URL(process.env.APP_ORIGIN).protocol!=='https:'){console.error('Production APP_ORIGIN must use HTTPS');process.exit(1)}
console.log('Configuration present for the confirmed Supabase project. Secret values were not printed.');
