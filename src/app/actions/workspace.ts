'use server';
import {readPrivateWorkspace,writePrivateWorkspace,readPublicWorkspace} from '@/lib/workspace-server';
import type {Workspace} from '@/lib/types';
import {revalidatePath} from 'next/cache';
export async function loadWorkspaceAction(){return readPrivateWorkspace()}
export async function saveWorkspaceAction(data:Workspace,revision:number){
 try{const next=await writePrivateWorkspace(data,revision);revalidatePath('/'+data.broker.slug);return {ok:true as const,revision:next}}
 catch(e){const dbError=e as {code?:string};if(dbError.code){console.error('Workspace save failed',{code:dbError.code});return {ok:false as const,error:'Could not save changes. Please try again.'}}return {ok:false as const,error:e instanceof Error?e.message:'Could not save changes'}}
}
export async function readPublicAction(slug:string){if(!/^[a-z0-9-]{2,80}$/.test(slug))throw Error('Invalid slug');return readPublicWorkspace(slug)}
