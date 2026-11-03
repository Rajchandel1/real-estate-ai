import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const browserPath=process.env.BROWSER_PATH||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
if(!browserPath)throw Error('Set BROWSER_PATH to a Chromium browser executable');
const base=process.argv[2]||'http://127.0.0.1:3000/my-agency',port=9232;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'crm-responsive-'));
let browser,ws;const errors=[],results=[];
try{
 browser=spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 browser.on('error',()=>{});let tabs;
 for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
 if(!tabs)throw Error('Could not start test browser');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 let sequence=0;const calls=new Map();
 ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const job=calls.get(data.id);if(job){calls.delete(data.id);data.error?job.reject(Error(data.error.message)):job.resolve(data.result)}}else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text)};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;calls.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async(expression)=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value};
 const waitFor=selector=>evaluate(`new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{if(document.querySelector(${JSON.stringify(selector)})){clearInterval(timer);resolve(true)}else if(Date.now()-start>40000){clearInterval(timer);reject(Error('Page did not render'))}},100)})`);
 await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:base});await waitFor('.storefront');
 const widths=[320,375,390,768,1024,1440];
 async function measure(view){for(const width of widths){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const dimensions=await evaluate(`(()=>{const width=document.documentElement.clientWidth;return {width,scroll:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>width+1,offenders:[...document.querySelectorAll('.storefront *,.modal *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2)}).slice(0,7).map(e=>e.className||e.tagName)}})()`);results.push({view,viewport:width,...dimensions})}}
 await measure('catalogue');
 await evaluate("document.querySelector('.filter-button').click()");await waitFor('.advanced-filters');await measure('filters');
 await evaluate("document.querySelector('.store-header .site-primary-button').click()");await waitFor('[role=dialog]');await measure('contact');await evaluate("document.querySelector('[aria-label=\"Close dialog\"]').click()");
 await evaluate("document.querySelector('.listing-bottom button').click()");await waitFor('.property-public-page');await measure('property');
 console.log(JSON.stringify({results,browserErrors:errors},null,2));
 if(results.some(r=>r.overflow)||errors.length)process.exitCode=1;
 await Promise.race([call('Browser.close').catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1000))]);
}catch(error){console.error(error.message);process.exitCode=1}
finally{
 ws?.close();if(browser&&browser.exitCode===null){const exited=new Promise(resolve=>browser.once('exit',resolve));browser.kill();await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,2000))])}
 const resolved=path.resolve(profile),tempRoot=path.resolve(os.tmpdir())+path.sep;
 if(resolved.startsWith(tempRoot)&&path.basename(resolved).startsWith('crm-responsive-'))try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:150})}catch{console.error('Browser profile is still in use; temporary cleanup deferred')}
}
