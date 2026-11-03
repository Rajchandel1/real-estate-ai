'use client';
export default function ErrorView(){return <main className="error-screen" role="alert"><h2>Listings couldn’t be loaded</h2><p>Please reload to fetch the latest listings.</p><button className="btn" onClick={()=>window.location.reload()}>Reload listings</button></main>}
