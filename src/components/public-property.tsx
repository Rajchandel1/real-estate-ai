'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useWorkspace} from '@/store/workspace';
import {currency,imageFor} from '@/lib/types';
import {PropertyOverview} from './property-overview';
import {ContactDialog} from './storefront';
import {Toast} from './toast';
export function PublicProperty({propertyId}:{propertyId:string}){
 const {db}=useWorkspace(),p=db.properties.find(p=>p.id===propertyId),[contact,setContact]=useState<'enquiry'|'visit'|null>(null),[message,setMessage]=useState('');if(!p)return null;
 return <div className="storefront"><header className="store-header site-container"><Link className="agency-brand" href={'/'+db.broker.slug}><span className="agency-mark">{db.broker.name.slice(0,2).toUpperCase()}</span><b>{db.broker.name}</b></Link><Link className="text-button" href={'/'+db.broker.slug}>All properties</Link></header><main className="site-container property-public-page"><Link href={'/'+db.broker.slug}>← Back to properties</Link><div className="page-head"><div><h1>{p.title}</h1><p>{p.location}, {p.city}</p></div><strong className="detail-price">{currency(p)}</strong></div><img className="property-hero" src={imageFor(p)} alt={p.title}/><div className="property-public-layout"><section><PropertyOverview property={p}/></section><aside className="card panel property-contact-card"><h2>Interested in this property?</h2><p>Contact {db.broker.name} for details or request a visit.</p><button className="site-primary-button" onClick={()=>setContact('enquiry')}>Enquire about this property</button><button className="site-primary-button" onClick={()=>setContact('visit')}>Request a site visit</button>{db.broker.phone&&<a href={'tel:'+db.broker.phone} className="text-button">Call the agency</a>}</aside></div></main>{contact&&<ContactDialog mode={contact} property={p} onClose={()=>setContact(null)} onDone={setMessage}/ >}{message&&<Toast message={message} onClose={()=>setMessage('')}/>}</div>;
}
