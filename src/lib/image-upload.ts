export const imageTypes=['image/jpeg','image/png','image/webp'] as const;
export function validImageBytes(bytes:Uint8Array,type:string){
 if(type==='image/jpeg')return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(type==='image/png')return [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 if(type==='image/webp')return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 return false;
}
