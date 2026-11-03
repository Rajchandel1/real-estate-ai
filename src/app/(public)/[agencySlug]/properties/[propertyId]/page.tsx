import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {readPublicProperty} from '@/lib/workspace-server';
import {WorkspaceProvider} from '@/store/workspace';
import {PublicProperty} from '@/components/public-property';
export const dynamic='force-dynamic';
type Props={params:Promise<{agencySlug:string;propertyId:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {agencySlug,propertyId}=await params;const data=await readPublicProperty(agencySlug,propertyId);if(!data)return {title:'Property not found'};const p=data.properties[0];return {title:p.title+' | '+data.broker.name,description:p.description.slice(0,160)||p.location,openGraph:{title:p.title,description:p.description.slice(0,160),...(p.image?{images:[p.image]}:{})}}}
export default async function Page({params}:Props){const {agencySlug,propertyId}=await params;const data=await readPublicProperty(agencySlug,propertyId);if(!data)notFound();return <WorkspaceProvider initialData={data} publicSlug={agencySlug}><PublicProperty propertyId={propertyId}/></WorkspaceProvider>}
