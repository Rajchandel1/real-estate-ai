import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {createElement,type ComponentType} from 'react';
import {renderToString} from 'react-dom/server';
import ts from 'typescript';
import {emptyWorkspace} from '../src/lib/empty-workspace';
import {SerialQueue} from '../src/lib/serial-queue';
import {OptimisticQueue} from '../src/lib/optimistic-queue';
import {workspaceSchema} from '../src/lib/validation';
import {mergeWorkspace} from '../src/lib/merge-workspace';
import type {Workspace} from '../src/lib/types';

test('server-provided workspace renders ready before hydration without a second request',()=>{
 const require=createRequire(import.meta.url),module={exports:{}};
 const compiled=ts.transpileModule(readFileSync('src/store/workspace.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}});
 runInNewContext(compiled.outputText,{module,exports:module.exports,require:(name:string)=>{
  if(name==='@/app/actions/workspace')return new Proxy({},{get:()=>()=>{throw Error('Initial render must not request workspace data')}});
  if(name==='@/lib/empty-workspace')return {emptyWorkspace};
  if(name==='@/lib/serial-queue')return {SerialQueue};
  if(name==='@/lib/optimistic-queue')return {OptimisticQueue};
  if(name==='@/lib/validation')return {workspaceSchema};
  if(name==='@/lib/merge-workspace')return {mergeWorkspace};
  return require(name);
 }});
 const {WorkspaceProvider,useWorkspace}=module.exports as {WorkspaceProvider:ComponentType<{initialData:Workspace;initialRevision:number;children?:React.ReactNode}>;useWorkspace:()=>{ready:boolean;db:Workspace}};
 function Probe(){const store=useWorkspace();return createElement('p',null,`${store.ready?'ready':'loading'}:${store.db.broker.slug}:${store.db.properties.length}`)}
 const html=renderToString(createElement(WorkspaceProvider,{initialData:emptyWorkspace('test-agency'),initialRevision:12},createElement(Probe)));
 assert.ok(html.includes('<p>ready:test-agency:0</p>'));
});
