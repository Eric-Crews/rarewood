import type {Lead} from './types';
import type {SupplierLead} from './supplier-leads';

export type BriefSection={title:string;fields:[string,string][]};
export type BrokerBrief={title:string;reference:string;sections:BriefSection[]};
const text=(value:unknown)=>value===undefined||value===null||String(value).trim()===''?'Not provided':String(value).trim();
const status=(value:string)=>text(value).replace(/\b\w/g,char=>char.toUpperCase());
function date(value:string){
 const timestamp=new Date(value);
 return Number.isNaN(timestamp.getTime())?text(value):new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/New_York'}).format(timestamp)+' ET';
}
const quantity=(amount:unknown,unit:unknown)=>[text(amount),text(unit)].filter(value=>value!=='Not provided').join(' ')||'Not provided';
export function buyerBrief(lead:Lead,includeNotes=false):BrokerBrief{
 const p=lead.payload;
 return {title:'Buyer sourcing brief',reference:lead.reference,sections:[
  {title:'Request overview',fields:[['Reference',text(lead.reference)],['Received',date(lead.createdAt)],['Status',status(lead.status)],['Assigned broker',text(lead.broker)]]},
  {title:'Buyer contact',fields:[['Company',text(lead.company)],['Contact',text(p.name)],['Email',text(lead.email)],['Phone',text(p.phone)],...(p.website?[['Website',text(p.website)] as [string,string]]:[])]},
  {title:'Product requirements',fields:[['Product',text(lead.product)],['Quantity',quantity(p.volume,p.unit)],['Purchase frequency',text(p.frequency)],['Grade / specification',text(p.grade)],['Dimensions / profile',text(p.dimensions)],['Application / end use',text(p.application)],['Packaging',text(p.packaging)]]},
  {title:'Delivery requirements',fields:[['Destination',text(p.destination)],['Required timing',text(p.timing)],['Receiving setup',text(p.receiving)]]},
  {title:'Additional details',fields:[['',text(p.details)]]},
  ...(includeNotes?[{title:'Internal follow-up notes',fields:[['',text(lead.notes)] as [string,string]]}]:[])
 ]};
}
export function supplierBrief(lead:SupplierLead,includeNotes=false):BrokerBrief{
 return {title:'Supplier inventory brief',reference:lead.reference,sections:[
  {title:'Inquiry overview',fields:[['Reference',text(lead.reference)],['Received',date(lead.createdAt)],['Status',status(lead.status)],['Assigned broker',text(lead.broker)]]},
  {title:'Supplier contact',fields:[['Supplier / company',text(lead.company)],['Contact',text(lead.name)],['Email',text(lead.email)],['Phone',text(lead.phone)]]},
  {title:'Available inventory',fields:[['Product',text(lead.productName)],['Quantity',quantity(lead.quantity,lead.unit)],['Inventory location',text(lead.location)],['Available',text(lead.availability)],['Last confirmed',date(lead.confirmedAt)],['Review due',date(lead.reviewDueAt)]]},
  {title:'Lot details',fields:[['',text(lead.details)]]},
  ...(includeNotes?[{title:'Internal follow-up notes',fields:[['',text(lead.notes)] as [string,string]]}]:[])
 ]};
}
export function briefFilename(brief:BrokerBrief){return (brief.reference.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)||'rarewood-lead')+'-broker-brief.pdf';}
