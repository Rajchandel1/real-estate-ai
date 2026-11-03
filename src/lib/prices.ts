export type PriceUnit='rupees'|'lakh'|'crore';
export const priceMultipliers:Record<PriceUnit,number>={rupees:1,lakh:100000,crore:10000000};
const inr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2});
export const formatRupees=(value:number)=>inr.format(value);
// Existing sale records are stored in lakh; rental records are rupees per month.
export const propertyPriceRupees=(p:{price:number;purpose:'sale'|'rent'})=>p.price*(p.purpose==='sale'?100000:1);
export const storedPriceFromRupees=(value:number,purpose:'sale'|'rent')=>purpose==='sale'?value/100000:value;
export const displayPropertyPrice=(property:{price:number;purpose:'sale'|'rent'})=>formatRupees(propertyPriceRupees(property))+(property.purpose==='rent'?' / month':'');
export function amountInRupees(input:string,unit:PriceUnit):number|null{
 const raw=input.replace(/[₹,\s]/g,'');if(!/^\d+(?:\.\d*)?$/.test(raw))return null;
 const amount=Number(raw)*priceMultipliers[unit];if(!Number.isFinite(amount)||amount<=0)return null;
 const rounded=Math.round((amount+Number.EPSILON)*100)/100;return rounded>0?rounded:null;
}
export function inputForPriceUnit(rupees:number,unit:PriceUnit){return (rupees/priceMultipliers[unit]).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:9})}
