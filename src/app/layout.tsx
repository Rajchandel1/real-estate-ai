import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Forma Pocket | Real Estate CRM',description:'Broker CRM and branded property catalogue'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
