import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import type {PoolClient} from 'pg';
import {syncRecords,readRecords} from '../src/lib/records';
import {emptyWorkspace} from '../src/lib/empty-workspace';
import {seedWorkspace} from '../src/lib/seed';

test('migration, entity roundtrip, tenant isolation, slot uniqueness and reset',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 await db.exec(await readFile('supabase/migrations/20261030045413_neutral_crm.sql','utf8'));
 const agency='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
 await db.query('insert into agencies(id,slug) values($1,$2),($3,$4)',[agency,'first-agency',other,'second-agency']);
 const adapter={query:async(sql:string,params?:unknown[])=>{const r=await db.query(sql,params);return {...r,rowCount:r.affectedRows??r.rows.length}}} as unknown as PoolClient;
 const initial=structuredClone(seedWorkspace());initial.properties[0].carpetArea=100;
 await db.exec('begin');await syncRecords(adapter,agency,emptyWorkspace(),initial);await db.exec('commit');
 const roundtrip=await readRecords(adapter,agency);assert.equal(roundtrip.properties.length,9);assert.equal(roundtrip.leads.length,5);assert.equal(roundtrip.visits[0].date,'2026-11-04');assert.deepEqual(await readRecords(adapter,other),{properties:[],leads:[],visits:[]});
 const revised={...initial,properties:initial.properties.map(p=>({...p}))};delete revised.properties[0].carpetArea;
 await syncRecords(adapter,agency,initial,revised);assert.equal((await readRecords(adapter,agency)).properties.find(p=>p.id==='p1')?.carpetArea,undefined);
 await assert.rejects(()=>db.query("insert into visits(id,agency_id,lead_id,property_id,date,time,status) values('duplicate',$1,'l3','p3','2026-11-04','11:00','Confirmed')",[agency]),/unique/i);
 await assert.rejects(()=>db.query("insert into visits(id,agency_id,lead_id,property_id,date,time,status) values('cross-tenant',$1,'l3','p3','2026-11-05','11:00','Confirmed')",[other]),/foreign key/i);
 const access=await db.query<{allowed:boolean}>("select has_table_privilege('anon','public.leads','SELECT') as allowed");assert.equal(access.rows[0].allowed,false);
 const secured=await db.query<{relrowsecurity:boolean}>("select relrowsecurity from pg_class where oid='public.leads'::regclass");assert.equal(secured.rows[0].relrowsecurity,true);
 await db.exec('begin');await syncRecords(adapter,agency,revised,emptyWorkspace());await db.exec('commit');assert.equal((await readRecords(adapter,agency)).properties.length,0);
 }finally{await db.close()}
});
