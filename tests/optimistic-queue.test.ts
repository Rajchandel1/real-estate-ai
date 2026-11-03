import test from 'node:test';
import assert from 'node:assert/strict';
import {OptimisticQueue} from '../src/lib/optimistic-queue';
test('all edits appear immediately while earlier writes are pending; writes coalesce',async()=>{
 let release!:(revision:number)=>void;const writes:{value:number;revision:number}[]=[];
 const queue=new OptimisticQueue(0,4,async(value,revision)=>{writes.push({value,revision});if(writes.length===1)return new Promise<number>(r=>{release=r});return revision+1},()=>{});
 const first=queue.commit(v=>v+1),second=queue.commit(v=>v+10),third=queue.commit(v=>v+100);
 assert.equal(queue.snapshot.value,111);assert.equal(queue.snapshot.busy,true);assert.deepEqual(writes,[{value:1,revision:4}]);
 release(5);await Promise.all([first,second,third]);assert.deepEqual(writes,[{value:1,revision:4},{value:111,revision:5}]);assert.equal(queue.snapshot.busy,false);assert.equal(queue.snapshot.revision,6);
});
test('failure preserves the latest draft and retry saves all later edits',async()=>{
 let fail!:(error:Error)=>void;let succeeds=false;
 const queue=new OptimisticQueue(0,0,async()=>{if(succeeds)return 1;return new Promise<number>((_,reject)=>{fail=reject})},()=>{});
 const first=queue.commit(v=>v+1),second=queue.commit(v=>v+10);const rejection=Promise.allSettled([first,second]);fail(Error('Offline'));await rejection;
 assert.equal(queue.snapshot.value,11);assert.equal(queue.confirmed,0);assert.equal(queue.snapshot.error,'Offline');assert.equal(queue.snapshot.busy,false);
 await assert.rejects(queue.commit(v=>v+100),/Offline/);assert.equal(queue.snapshot.value,111);
 succeeds=true;await queue.retry();assert.equal(queue.confirmed,111);assert.equal(queue.snapshot.error,'');
});
