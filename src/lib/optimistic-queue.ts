export type OptimisticState<T>={value:T;busy:boolean;error:string;revision:number};
/** Displays every edit immediately; serializes/coalesces writes and retains failed drafts. */
export class OptimisticQueue<T>{
 private value:T;private saved:T;private revision:number;private version=0;private savedVersion=0;
 private busy=false;private error='';private paused=false;
 private waiters:{version:number;resolve:()=>void;reject:(error:Error)=>void}[]=[];
 constructor(value:T,revision:number,private save:(value:T,revision:number)=>Promise<number>,private changed:(state:OptimisticState<T>)=>void){this.value=value;this.saved=value;this.revision=revision}
 get snapshot(){return {value:this.value,busy:this.busy,error:this.error,revision:this.revision}}
 get confirmed(){return this.saved}
 private publish(){this.changed(this.snapshot)}
 commit(update:(value:T)=>T){
  this.value=update(this.value);this.version++;
  const task=new Promise<void>((resolve,reject)=>this.waiters.push({version:this.version,resolve,reject}));
  if(this.paused){this.waiters.pop()!.reject(Error(this.error));this.publish();return task}
  this.publish();void this.flush();return task;
 }
 private async flush(){
  if(this.busy||this.paused)return;this.busy=true;this.publish();
  try{while(this.savedVersion<this.version){const version=this.version,value=this.value;
   this.revision=await this.save(value,this.revision);this.saved=value;this.savedVersion=version;
   const complete=this.waiters.filter(w=>w.version<=version);this.waiters=this.waiters.filter(w=>w.version>version);complete.forEach(w=>w.resolve());
  }}catch(cause){const error=cause instanceof Error?cause:Error('Could not save changes');this.error=error.message;this.paused=true;this.waiters.splice(0).forEach(w=>w.reject(error))}
  finally{this.busy=false;this.publish()}
 }
 retry(){this.paused=false;this.error='';const task=new Promise<void>((resolve,reject)=>this.waiters.push({version:this.version,resolve,reject}));void this.flush();return task}
 rebase(saved:T,revision:number,draft:T){if(this.busy)throw Error('Changes are still syncing');this.saved=saved;this.value=draft;this.revision=revision;this.savedVersion=0;this.version=1;this.publish()}
 reset(value:T,revision:number){if(this.busy)throw Error('Changes are still syncing');this.value=value;this.saved=value;this.revision=revision;this.version=0;this.savedVersion=0;this.error='';this.paused=false;this.publish()}
}
