export type Purpose='sale'|'rent';
export type PropertyType='apartment'|'villa'|'plot'|'commercial';
export type PropertyStatus='Active'|'Inactive'|'Sold'|'Rented';
export type LeadStatus='New'|'Contacted'|'Qualified'|'Visit booked'|'Closed';
export type VisitStatus='Requested'|'Confirmed'|'Completed'|'Cancelled';
export interface Property {id:string;title:string;purpose:Purpose;type:PropertyType;price:number;bhk:number;baths:number;sqft:number;carpetArea?:number;location:string;city:string;status:PropertyStatus;featured:boolean;description:string;amenities:string[];image:string;furnishing:string;societyName:string;floorNumber?:number;totalFloors?:number;createdAt:string;views:number}
export interface Lead {id:string;name:string;phone:string;email:string;status:LeadStatus;source:string;purpose:Purpose;budget:string;location:string;type:string;bhk:string;interests:string[];notes:string;createdAt:string}
export interface Visit {id:string;leadId:string;propertyId:string;date:string;time:string;status:VisitStatus;createdAt:string}
export interface Broker {name:string;tagline:string;city:string;phone:string;email:string;about:string;color:string;siteColor:string;slug:string}
export interface Workspace {version:number;broker:Broker;properties:Property[];leads:Lead[];visits:Visit[]}
export const uid=()=>crypto.randomUUID();
export const dateKey=()=>new Date().toLocaleDateString('en-CA');
export {displayPropertyPrice as currency} from './prices';
export const imageFor=(p:Property)=>p.image||`https://images.unsplash.com/photo-${['1600596542815-ffad4c1539a9','1600607687920-4e2a09cf159d','1600047509807-ba8f99d2cdde','1600566753190-17f0baa2a6c3','1600585154340-be6161a56a0c'][Math.abs(p.title.length)%5]}?auto=format&fit=crop&w=900&q=80`;
export const validPhone=(s:string)=>s.replace(/\D/g,'').length>=10&&s.replace(/\D/g,'').length<=15;
