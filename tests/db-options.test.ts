import test from 'node:test';
import assert from 'node:assert/strict';
import {X509Certificate} from 'node:crypto';
import {databasePoolOptions} from '../src/lib/db-options.mjs';
test('Supabase connections verify TLS using the bundled CA even with SSL URL flags',()=>{
 const options=databasePoolOptions({DATABASE_URL:'postgresql://user:password@db.example.supabase.co:5432/postgres?sslmode=require',NODE_ENV:'production'});
 assert.ok(options.ssl&&typeof options.ssl==='object');assert.equal(options.ssl.rejectUnauthorized,true);
 assert.ok(options.ssl.ca);assert.match(new X509Certificate(options.ssl.ca).subject,/Supabase Root 2021 CA/);
 assert.equal(new URL(options.connectionString).searchParams.has('sslmode'),false);
});
test('production cannot disable database TLS with the development switch',()=>{
 const options=databasePoolOptions({DATABASE_URL:'postgresql://user:password@example.com:5432/postgres',DATABASE_SSL:'disable',NODE_ENV:'production'});
 assert.deepEqual(options.ssl,{rejectUnauthorized:true});
});
