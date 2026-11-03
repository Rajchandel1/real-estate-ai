'use client';
import {createContext,useContext,useEffect,useState,useCallback,useMemo,useRef,type ReactNode,type CSSProperties} from 'react';
import {loadWorkspaceAction,saveWorkspaceAction,readPublicAction} from '@/app/actions/workspace';
import type {Workspace} from '@/lib/types';
import {emptyWorkspace} from '@/lib/empty-workspace';
import {OptimisticQueue,type OptimisticState} from '@/lib/optimistic-queue';
import {workspaceSchema} from '@/lib/validation';
import {mergeWorkspace} from '@/lib/merge-workspace';
type Store={db:Workspace;ready:boolean;busy:boolean;error:string;commit:(update:(old:Workspace)=>Workspace)=>Promise<void>;mutate:(update:(old:Workspace)=>Workspace)=>void;replace:(data:Workspace)=>Promise<void>;reset:()=>Promise<void>;reload:()=>Promise<void>;retry:()=>Promise<void>};
const C=createContext<Store|null>(null);
export function WorkspaceProvider({children,initialData,initialRevision=0,publicSlug}:{children:ReactNode;initialData?:Workspace;initialRevision?:number;publicSlug?:string}){
 const [state,setState]=useState<OptimisticState<Workspace>>({value:initialData||emptyWorkspace(),revision:initialRevision,busy:false,error:''});
 const [ready,setReady]=useState(!!initialData),[loadError,setLoadError]=useState('');const loaded=useRef(!!initialData);
 const engine=useRef<OptimisticQueue<Workspace>|null>(null);
 if(!engine.current)engine.current=new OptimisticQueue(state.value,initialRevision,async(data,revision)=>{const result=await saveWorkspaceAction(data,revision);if(!result.ok)throw Error(result.error);return result.revision},setState);
 const reload=useCallback(async()=>{if(engine.current!.snapshot.busy)return;setLoadError('');try{if(publicSlug){const payload=await readPublicAction(publicSlug);if(!payload)throw Error('Agency not found');engine.current!.reset(payload,0)}else{const data=await loadWorkspaceAction();engine.current!.reset(data.payload,data.revision)}loaded.current=true;setReady(true)}catch(e){setLoadError(e instanceof Error?e.message:'Could not load workspace');setReady(loaded.current)}},[publicSlug]);
 useEffect(()=>{if(!initialData)void reload()},[reload,initialData]);
 useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(!publicSlug&&(state.busy||state.error)){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[publicSlug,state.busy,state.error]);
 const commit=useCallback((fn:(old:Workspace)=>Workspace)=>{
  if(publicSlug)throw Error('Public workspace is read-only');if(!loaded.current)throw Error('Load the workspace before saving');
  return engine.current!.commit(old=>{const parsed=workspaceSchema.safeParse(fn(old));if(!parsed.success)throw Error(parsed.error.issues[0]?.message||'Please check the form fields');parsed.data.leads=parsed.data.leads.map(lead=>({...lead,phone:lead.phone.replace(/\D/g,'')}));return parsed.data});
 },[publicSlug]);
 const mutate=useCallback((fn:(old:Workspace)=>Workspace)=>{void commit(fn).catch(()=>{})},[commit]);
 const replace=useCallback((data:Workspace)=>commit(()=>data),[commit]);
 const reset=useCallback(()=>commit(old=>({...emptyWorkspace(old.broker.slug),broker:old.broker})),[commit]);
 const retry=useCallback(async()=>{setLoadError('');try{const queue=engine.current!;if(queue.snapshot.error.startsWith('CONFLICT:')){const fresh=await loadWorkspaceAction();const merged=mergeWorkspace(queue.confirmed,queue.snapshot.value,fresh.payload);queue.rebase(fresh.payload,fresh.revision,merged)}await queue.retry()}catch(e){setLoadError(e instanceof Error?e.message:'Could not retry save');throw e}},[]);
 const db=state.value,error=loadError||state.error;
 const value=useMemo(()=>({db,ready,busy:state.busy,error,commit,mutate,replace,reset,reload,retry}),[db,ready,state.busy,error,commit,mutate,replace,reset,reload,retry]);
 return <C.Provider value={value}><div className="workspace-root" style={{'--accent':db.broker.color,'--site-primary':db.broker.siteColor} as CSSProperties}>{children}</div></C.Provider>;
}
export function useWorkspace(){const value=useContext(C);if(!value)throw Error('WorkspaceProvider missing');return value}
