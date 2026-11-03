import {CRM} from '@/components/crm';
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;return <CRM section={section}/>}
