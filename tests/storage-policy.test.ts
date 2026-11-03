import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
test('image policies allow active tenant members and reject cross-tenant or revoked uploads',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant insert,select,delete on storage.objects to authenticated;`);
 await db.exec(await readFile('supabase/migrations/20261030045413_neutral_crm.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/20261030110000_property_image_access.sql','utf8'));
 const user='00000000-0000-4000-8000-000000000001',agency='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003';
 await db.query('insert into auth.users(id) values($1)',[user]);await db.query("insert into agencies(id,slug) values($1,'agency-a'),($2,'agency-b')",[agency,other]);await db.query("insert into agency_memberships(user_id,agency_id,role) values($1,$2,'agent')",[user,agency]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated');
 await db.query("insert into storage.objects(bucket_id,name) values('property-images',$1)",[agency+'/photo.jpg']);
 await assert.rejects(()=>db.query("insert into storage.objects(bucket_id,name) values('property-images',$1)",[other+'/photo.jpg']),/row-level security/i);
 await db.exec('reset role');await db.query('update agency_memberships set active=false where user_id=$1',[user]);await db.exec('set role authenticated');
 assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(()=>db.query("insert into storage.objects(bucket_id,name) values('property-images',$1)",[agency+'/another.jpg']),/row-level security/i);
 }finally{await db.close()}
});
