import type {Workspace} from '@/lib/types';
export function metrics(db:Workspace){return {active:db.properties.filter(p=>p.status==='Active').length,newLeads:db.leads.filter(l=>l.status==='New').length,qualified:db.leads.filter(l=>['Qualified','Visit booked'].includes(l.status)).length,visits:db.visits.filter(v=>['Requested','Confirmed'].includes(v.status)).length}}
