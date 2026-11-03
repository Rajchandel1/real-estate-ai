'use client';
import Script from 'next/script';
import {useEffect,useRef,useState} from 'react';
type Turnstile={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
declare global{interface Window{turnstile?:Turnstile}}
export function Captcha({onToken,resetKey}:{onToken:(token:string)=>void;resetKey:number}){
 const container=useRef<HTMLDivElement>(null),[loaded,setLoaded]=useState(false),sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 useEffect(()=>{if(!loaded||!sitekey||!container.current||!window.turnstile)return;const api=window.turnstile;const id=api.render(container.current,{sitekey,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken('')});return()=>{api.remove(id)}},[loaded,sitekey,onToken,resetKey]);
 if(!sitekey)return null;
 return <div className="wide"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setLoaded(true)}/><div ref={container}/></div>;
}
