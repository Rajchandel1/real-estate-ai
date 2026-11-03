import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {createElement,type ComponentType} from 'react';
import {renderToString} from 'react-dom/server';
import ts from 'typescript';
import type {Workspace} from '../../src/lib/types';
/** Render real components with framework navigation and remote actions stubbed. */
export function renderUI(file:string,exportName:string,props:Record<string,unknown>,workspace:Workspace){
 const require=createRequire(import.meta.url),cache=new Map<string,{exports:unknown}>();
 const load=(filename:string):any=>{
  const full=path.resolve(filename);if(cache.has(full))return cache.get(full)!.exports;
  const module={exports:{}};cache.set(full,module);
  const output=ts.transpileModule(readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});
  runInNewContext(output.outputText,{module,exports:module.exports,console,process,setTimeout,clearTimeout,URL,crypto:globalThis.crypto,require:(name:string)=>{
   if(name.startsWith('@/app/actions/'))return new Proxy({},{get:()=>()=>{throw Error('Server action called while rendering')}});
   if(name==='next/link')return {__esModule:true,default:({children,prefetch,replace,scroll,onNavigate,...p}:any)=>createElement('a',p,children)};
   if(name==='next/navigation')return {useRouter:()=>({push(){},replace(){},prefetch(){}})};
   if(name==='next/script')return {__esModule:true,default:()=>null};
   if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(full),name);for(const ext of ['', '.ts','.tsx'])if(existsSync(base+ext))return load(base+ext)}
   return require(name);
  }});return module.exports;
 };
 const {WorkspaceProvider}=load('src/store/workspace.tsx'),Component=load(file)[exportName] as ComponentType<any>;
 return renderToString(createElement(WorkspaceProvider,{initialData:workspace,initialRevision:3},createElement(Component,props)));
}
