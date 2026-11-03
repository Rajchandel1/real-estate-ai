import type {Workspace} from './types';
const canonical=(value:unknown):string=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
/** Rebase disjoint edits without overwriting another user's changes to the same field/record. */
export function mergeWorkspace(base:Workspace,local:Workspace,remote:Workspace):Workspace{
 const merged:Workspace={...remote,broker:{...remote.broker}};
 for(const key of Object.keys(local.broker) as (keyof Workspace['broker'])[]){if(local.broker[key]!==base.broker[key]){if(remote.broker[key]!==base.broker[key]&&remote.broker[key]!==local.broker[key])throw Error('Agency settings changed elsewhere. Download your draft before reloading.');merged.broker[key]=local.broker[key]}}
 for(const table of ['properties','leads','visits'] as const){
  const before=new Map(base[table].map(x=>[x.id,canonical(x)])),mine=new Map(local[table].map(x=>[x.id,x])),theirs=new Map(remote[table].map(x=>[x.id,x]));
  for(const id of new Set([...before.keys(),...mine.keys()])){const original=before.get(id),next=mine.get(id),other=theirs.get(id);if(original===canonical(next))continue;
   if(original!==canonical(other)&&canonical(other)!==canonical(next))throw Error('The same record was changed elsewhere. Download your draft before reloading.');
   if(next)theirs.set(id,next);else theirs.delete(id);
  }
  // Each collection retains its own entity type; the table union is resolved here.
  (merged[table] as typeof merged[typeof table])=[...theirs.values()] as typeof merged[typeof table];
 }
 return merged;
}
