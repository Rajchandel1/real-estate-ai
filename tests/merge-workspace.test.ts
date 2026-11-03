import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeWorkspace} from '../src/lib/merge-workspace';
import {seedWorkspace} from '../src/lib/seed';
test('retry preserves independent remote enquiries and local listing edits',()=>{
 const base=structuredClone(seedWorkspace()),local=structuredClone(base),remote=structuredClone(base);
 local.properties[0].status='Sold';remote.leads.push({...remote.leads[0],id:'new-enquiry'});
 const result=mergeWorkspace(base,local,remote);assert.equal(result.properties[0].status,'Sold');assert.ok(result.leads.some(l=>l.id==='new-enquiry'));
});
test('retry refuses to silently overwrite a record edited on another device',()=>{
 const base=structuredClone(seedWorkspace()),local=structuredClone(base),remote=structuredClone(base);local.properties[0].price=80;remote.properties[0].price=90;
 assert.throws(()=>mergeWorkspace(base,local,remote),/same record/);
});
