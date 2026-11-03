'use client';
export default function GlobalError({reset}:{error:Error;reset:()=>void}){return <html lang="en"><body style={{fontFamily:'system-ui',padding:'48px',background:'#f6f7fb',color:'#20283c'}}><h1>Could not open the app</h1><p>Please retry or return to sign in.</p><button onClick={reset}>Try again</button><p><a href="/login">Back to sign in</a></p></body></html>}
