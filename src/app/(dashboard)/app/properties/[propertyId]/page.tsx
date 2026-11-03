import {CRM} from '@/components/crm';
export default async function Page({params}:{params:Promise<{propertyId:string}>}){const {propertyId}=await params;return <CRM section="property-details" propertyId={propertyId}/>}
