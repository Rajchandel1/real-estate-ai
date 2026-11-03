import 'server-only';
import {Pool} from 'pg';
import {databasePoolOptions} from './db-options.mjs';
const globalForDb=globalThis as unknown as {crmPool?:Pool};
export const pool=globalForDb.crmPool??new Pool(process.env.DATABASE_URL?databasePoolOptions():{max:5,connectionTimeoutMillis:5000});
globalForDb.crmPool=pool;
pool.on('error',()=>console.error('Database pool connection failed'));
