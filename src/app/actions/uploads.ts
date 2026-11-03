'use server';
import {z} from 'zod';
import {requireAgency} from '@/lib/authz';
import {createSupabaseAdmin} from '@/lib/supabase/admin';
import {pool} from '@/lib/db';
import {consumeLimit} from '@/lib/rate-limit';
import {validImageBytes} from '@/lib/image-upload';
import {createSupabaseServer} from '@/lib/supabase/server';
async function storageClient(){return process.env.SUPABASE_SECRET_KEY?createSupabaseAdmin():createSupabaseServer()}
const schema=z.object({type:z.enum(['image/jpeg','image/png','image/webp']),size:z.number().int().positive().max(5*1024*1024)});
export async function prepareImageUpload(input:z.input<typeof schema>){
 const {agencyId}=await requireAgency();const data=schema.parse(input),c=await pool.connect();try{await consumeLimit(c,'upload:'+agencyId,30)}finally{c.release()}
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[data.type],path=`${agencyId}/${crypto.randomUUID()}.${ext}`,sb=await storageClient();
 const {data:signed,error}=await sb.storage.from('property-images').createSignedUploadUrl(path);if(error)throw Error('Image upload is not configured yet. Ask the owner to finish Storage access setup.');
 return {path,token:signed.token,url:sb.storage.from('property-images').getPublicUrl(path).data.publicUrl};
}
export async function verifyImageUpload(input:{path:string;type:string}){
 const {agencyId}=await requireAgency(),d=z.object({path:z.string().max(200),type:z.enum(['image/jpeg','image/png','image/webp'])}).parse(input);
 if(!d.path.startsWith(agencyId+'/')||!new RegExp('^'+agencyId+'/[a-f0-9-]{36}\\.(jpg|png|webp)$').test(d.path))throw Error('Invalid image path');
 const sb=await storageClient(),{data,error}=await sb.storage.from('property-images').download(d.path);if(error||!data)throw Error('Could not verify image upload');
 if(data.size>5*1024*1024||!validImageBytes(new Uint8Array(await data.arrayBuffer()),d.type)){await sb.storage.from('property-images').remove([d.path]);throw Error('Invalid image contents')}
 return sb.storage.from('property-images').getPublicUrl(d.path).data.publicUrl;
}
