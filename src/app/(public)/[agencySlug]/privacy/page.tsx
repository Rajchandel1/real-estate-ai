import Link from 'next/link';
import {notFound} from 'next/navigation';
import {readPublicWorkspace} from '@/lib/workspace-server';
export const dynamic='force-dynamic';
export default async function Privacy({params}:{params:Promise<{agencySlug:string}>}){
 const {agencySlug}=await params,data=await readPublicWorkspace(agencySlug);if(!data)notFound();const broker=data.broker;
 return <main className="site-container panel"><Link href={'/'+agencySlug}>Back to properties</Link><h1>Enquiry privacy</h1><p>When you submit an enquiry, {broker.name} receives your name, phone number, optional email, message, and selected property or visit details to respond to your request.</p><p>Enquiries are stored in the agency’s private CRM on Supabase. Approved agency members can access them. Uploaded listing photos are public. Saved-property preferences remain in your browser.</p><p>Public forms use Cloudflare Turnstile to help prevent abuse. Your browser connects to Cloudflare for this check.</p><p>Contact the agency to ask about your enquiry, correct your details, or request deletion.</p>{broker.email&&<p><a href={'mailto:'+broker.email}>{broker.email}</a></p>}{broker.phone&&<p><a href={'tel:'+broker.phone}>{broker.phone}</a></p>}</main>;
}
