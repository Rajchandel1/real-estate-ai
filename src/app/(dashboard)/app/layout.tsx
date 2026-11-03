import {redirect} from 'next/navigation';
import {readPrivateWorkspace} from '@/lib/workspace-server';
import {WorkspaceProvider} from '@/store/workspace';
import {LogoutButton} from '@/components/logout-button';
export const metadata={robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 if(!process.env.DATABASE_URL)return <main className="auth-page"><section className="auth-card"><h1>Connect your database</h1><p>The app is running. The database connection is still required before the private CRM can open.</p><p>Set the Supabase pooler connection string in <code>DATABASE_URL</code> in your local environment, then reload this page.</p><p>Keep the database password private.</p><LogoutButton/></section></main>;
 let initial:Awaited<ReturnType<typeof readPrivateWorkspace>>;
 try{initial=await readPrivateWorkspace()}catch(e){if(e instanceof Error&&e.message==='UNAUTHENTICATED')redirect('/login');if(!(e instanceof Error)||!['NOT_A_MEMBER','NOT_APPROVED'].includes(e.message))throw e;return <main className="auth-page"><section className="auth-card"><h1>Access restricted</h1><p>Your Google account has not been added to this agency. Ask the owner to approve it.</p><LogoutButton/></section></main>}
 return <WorkspaceProvider initialData={initial.payload} initialRevision={initial.revision}>{children}</WorkspaceProvider>;
}
