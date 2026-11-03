'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useWorkspace} from '@/store/workspace';
import {PropertyOverview} from '@/components/property-overview';
import {Button,Empty,Badge,statusKind} from '@/components/ui';
import {PropertyWizard} from './wizard';
import {imageFor,currency,type PropertyStatus} from '@/lib/types';
export function PropertyDetails({propertyId}:{propertyId:string}){
 const {db,mutate}=useWorkspace(),[editing,setEditing]=useState(false),p=db.properties.find(p=>p.id===propertyId);
 if(!p)return <Empty title="Property not found" sub="Go back to your portfolio to choose a listing."/>;
 return <><Link href="/app/properties" className="text-button">← Back to portfolio</Link><div className="page-head"><div><h1>{p.title}</h1><p>{p.location}, {p.city}</p></div><Button onClick={()=>setEditing(true)}>Edit property</Button></div><div className="card property-detail-page"><img className="property-hero" src={imageFor(p)} alt={p.title}/><div className="panel"><div className="between row wrap"><strong className="detail-price">{currency(p)}</strong><Badge kind={statusKind(p.status)}>{p.status}</Badge><label className="field"><span>Listing status</span><select value={p.status} onChange={e=>{const status=e.target.value as PropertyStatus;mutate(w=>({...w,properties:w.properties.map(x=>x.id===p.id?{...x,status}:x)}))}}>{['Active','Inactive','Sold','Rented'].map(s=><option key={s}>{s}</option>)}</select></label></div><PropertyOverview property={p} internal/></div></div>{editing&&<PropertyWizard property={p} onClose={()=>setEditing(false)}/>}</>;
}
