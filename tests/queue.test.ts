import test from 'node:test';
import assert from 'node:assert/strict';
import {SerialQueue} from '../src/lib/serial-queue';
test('rapid mutations are saved in order using the latest committed state',async()=>{const queue=new SerialQueue();let state=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve});const first=queue.run(async()=>{await gate;state+=1});const second=queue.run(async()=>{state+=10});await Promise.resolve();assert.equal(state,0);release();await Promise.all([first,second]);assert.equal(state,11)});
test('a failed mutation is reported and subsequent mutations still execute',async()=>{const queue=new SerialQueue();const first=queue.run(async()=>{throw Error('Conflict')});const second=queue.run(async()=>42);await assert.rejects(first,/Conflict/);assert.equal(await second,42);await queue.settled});
