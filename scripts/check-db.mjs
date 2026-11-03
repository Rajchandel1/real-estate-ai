import {createRequire} from 'node:module';
import {databasePoolOptions} from '../src/lib/db-options.mjs';
import pg from 'pg';
const require=createRequire(import.meta.url);require('@next/env').loadEnvConfig(process.cwd());
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is missing');process.exit(1)}
const pool=new pg.Pool({...databasePoolOptions(),max:1});
try{
 const {rows}=await pool.query("select tablename from pg_tables where schemaname='public' and tablename=any($1::text[]) order by tablename",[['agencies','agency_memberships','properties','leads','visits','public_submissions','audit_events','rate_limits']]);
 if(rows.length!==8)throw Error('Expected CRM tables are missing; apply the neutral CRM migration first');
 const legacy=await pool.query("select tablename from pg_tables where schemaname='public' and left(tablename,6)='forma_'");
 console.log('Database connection successful; all 8 CRM tables are present.');
 if(legacy.rows.length)console.log('Legacy tables still exist: '+legacy.rows.map(r=>r.tablename).join(', '));
}catch(e){console.error('Database verification failed: '+(e.code||'Check connection settings and migration status'));process.exitCode=1}finally{await pool.end()}
