'use client';
import Link from 'next/link';
import {Modal,Field,Button} from '@/components/ui';
import {useWorkspace} from '@/store/workspace';
import type {LeadStatus} from '@/lib/types';
export const leadStatuses:LeadStatus[]=['New','Contacted','Qualified','Visit booked','Closed'];
export function LeadDetails({leadId,onClose,onEdit}:{leadId:string;onClose:()=>void;onEdit:()=>void}){
 const {db,mutate}=useWorkspace(),lead=db.leads.find(l=>l.id===leadId);if(!lead)return null;
 const fields=[['Name',lead.name],['Phone',lead.phone],['Email',lead.email],['Budget',lead.budget],['Preferred location',lead.location],['Purpose',lead.purpose],['Property type',lead.type],['Bedrooms',lead.bhk],['Source',lead.source],['Received',new Date(lead.createdAt).toLocaleString('en-IN')]];
 return <Modal title="Lead details" subtitle={lead.name} onClose={onClose}><div className="modal-body"><div className="row gap wrap"><a className="btn" href={'tel:'+lead.phone.replace(/[^+\d]/g,'')}>Call {lead.name.split(' ')[0]}</a>{lead.email&&<a className="btn secondary" href={'mailto:'+lead.email}>Email</a>}</div><dl className="property-facts">{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not provided'}</dd></div>)}</dl><Field label="Lead stage"><select value={lead.status} onChange={e=>{const status=e.target.value as LeadStatus;mutate(w=>({...w,leads:w.leads.map(l=>l.id===lead.id?{...l,status}:l)}))}}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></Field><h3>Buyer message / notes</h3><p className="preserve-lines">{lead.notes||'No notes provided'}</p><h3>Interested properties</h3>{lead.interests.length?<ul>{lead.interests.map(id=><li key={id}><Link className="text-button" href={'/app/properties/'+encodeURIComponent(id)}>{db.properties.find(p=>p.id===id)?.title||'Archived property'}</Link></li>)}</ul>:<p className="muted">No specific property selected</p>}</div><footer className="modal-footer"><Button variant="secondary" onClick={onEdit}>Edit details</Button><Button onClick={onClose}>Done</Button></footer></Modal>;
}
