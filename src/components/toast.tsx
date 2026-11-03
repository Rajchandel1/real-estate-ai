'use client';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function Toast({message,onClose}:{message:string;onClose:()=>void}){
 const callback=useRef(onClose);callback.current=onClose;
 useEffect(()=>{const timer=setTimeout(()=>callback.current(),4000);return()=>clearTimeout(timer)},[message]);
 return <div className="toast" role="status"><span>{message}</span><button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={16}/></button></div>;
}
