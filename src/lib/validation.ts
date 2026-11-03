import {z} from 'zod';
const text=(max:number)=>z.string().trim().max(max);
const id=z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const timestamp=z.string().refine(v=>Number.isFinite(Date.parse(v)),'Invalid timestamp');
export const slugSchema=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
export const phoneSchema=z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/).refine(v=>/^\d{10,15}$/.test(v.replace(/\D/g,'')),'Enter a valid phone number');
export const imageSchema=z.string().max(2048).refine(v=>!v||(()=>{try{return new URL(v).protocol==='https:'}catch{return false}})(),'Use an HTTPS image URL');
export const propertySchema=z.object({id,title:text(150).min(1),purpose:z.enum(['sale','rent']),type:z.enum(['apartment','villa','plot','commercial']),price:z.number().finite().positive().max(1e12),bhk:z.number().int().min(0).max(100),baths:z.number().int().min(0).max(100),sqft:z.number().finite().positive().max(1e9),carpetArea:z.number().finite().positive().max(1e9).optional(),location:text(150).min(1),city:text(100).min(1),status:z.enum(['Active','Inactive','Sold','Rented']),featured:z.boolean(),description:text(10000),amenities:z.array(text(100)).max(100),image:imageSchema,furnishing:text(100),societyName:text(150),floorNumber:z.number().int().min(0).max(1000).optional(),totalFloors:z.number().int().min(0).max(1000).optional(),createdAt:timestamp,views:z.number().int().nonnegative()}).strict().refine(p=>p.floorNumber===undefined||p.totalFloors===undefined||p.floorNumber<=p.totalFloors,'Floor exceeds total floors');
export const leadSchema=z.object({id,name:text(150).min(1),phone:phoneSchema,email:z.union([z.literal(''),z.string().email().max(120)]),status:z.enum(['New','Contacted','Qualified','Visit booked','Closed']),source:text(100),purpose:z.enum(['sale','rent']),budget:text(150),location:text(150),type:text(100),bhk:text(20),interests:z.array(id).max(1000),notes:text(10000),createdAt:timestamp}).strict();
export const daySchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v},'Invalid calendar date');
export const timeSchema=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const visitSchema=z.object({id,leadId:id,propertyId:id,date:daySchema,time:timeSchema,status:z.enum(['Requested','Confirmed','Completed','Cancelled']),createdAt:timestamp}).strict();
export const brokerSchema=z.object({name:text(100).min(1),slug:slugSchema,tagline:text(300),city:text(100),phone:z.union([z.literal(''),phoneSchema]),email:z.union([z.literal(''),z.string().email().max(120)]),about:text(5000),color:z.string().regex(/^#[\da-fA-F]{6}$/),siteColor:z.string().regex(/^#[\da-fA-F]{6}$/)}).strict();
export const workspaceSchema=z.object({version:z.literal(2),broker:brokerSchema,properties:z.array(propertySchema).max(10000),leads:z.array(leadSchema).max(10000),visits:z.array(visitSchema).max(10000)}).strict().superRefine((w,ctx)=>{
 const ps=new Set(w.properties.map(p=>p.id)),ls=new Set(w.leads.map(l=>l.id)),slots=new Set<string>();
 for(const items of [w.properties,w.leads,w.visits])if(new Set(items.map(x=>x.id)).size!==items.length)ctx.addIssue({code:'custom',message:'Duplicate record IDs'});
 for(const l of w.leads)if(l.interests.some(p=>!ps.has(p)))ctx.addIssue({code:'custom',message:'Lead refers to an unknown property'});
 for(const v of w.visits){if(!ps.has(v.propertyId)||!ls.has(v.leadId))ctx.addIssue({code:'custom',message:'Visit refers to an unknown property or buyer'});if(['Requested','Confirmed'].includes(v.status)){const key=`${v.propertyId}/${v.date}/${v.time}`;if(slots.has(key))ctx.addIssue({code:'custom',message:'Visit slot is already occupied'});slots.add(key)}}
});
export function visitIsFuture(date:string,time:string,timeZone='Asia/Kolkata',now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),get=(name:string)=>parts.find(p=>p.type===name)?.value;
 return `${date}T${time}`>`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
