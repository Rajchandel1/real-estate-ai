import {notFound} from 'next/navigation';
import {readPublicWorkspace} from '@/lib/workspace-server';
import {WorkspaceProvider} from '@/store/workspace';
import {Storefront} from '@/components/storefront';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{agencySlug:string}>}):Promise<Metadata>{
 const {agencySlug}=await params;if(!/^[a-z0-9-]{2,80}$/.test(agencySlug))return {};
 const data=await readPublicWorkspace(agencySlug);if(!data)return {title:'Agency not found'};
 const title=data.broker.name+' | Properties',description=data.broker.tagline||'Browse available properties and contact the agency';
 return {title,description,openGraph:{title,description,type:'website'}};
}
export default async function Page({params}:{params:Promise<{agencySlug:string}>}){
 const {agencySlug}=await params;if(!/^[a-z0-9-]{2,80}$/.test(agencySlug))notFound();const data=await readPublicWorkspace(agencySlug);if(!data)notFound();return <WorkspaceProvider initialData={data} publicSlug={agencySlug}><Storefront/></WorkspaceProvider>
}
