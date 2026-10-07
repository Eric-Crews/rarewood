import type {Lead} from './types';
import type {SupplierLead} from './supplier-leads';
export const PRIMARY_BROKER={name:'Mark Olivari',company:'Scrounger’s Paradise',email:'mholivari@yahoo.com'} as const;
export type BrokerLead={kind:'buyer';lead:Lead}|{kind:'supplier';lead:SupplierLead};
const value=(input:unknown)=>String(input??'').trim()||'Not provided';
const singleLine=(input:unknown)=>value(input).replace(/[\r\n]+/g,' ');
export function brokerEmailDraft(input:BrokerLead){
 const lead=input.lead;
 if(input.kind==='buyer'){
  const p=input.lead.payload;
  return {subject:`Buyer inquiry: ${singleLine(input.lead.product)} | ${lead.reference}`.slice(0,200),body:`Hello,\n\nPlease review this buyer inquiry from Rarewood Exchange.\n\nProduct: ${value(input.lead.product)}\nQuantity: ${value(p.volume)} ${value(p.unit)}\nDestination: ${value(p.destination)}\nTiming: ${value(p.timing)}\nBuyer: ${value(input.lead.company)}\nContact: ${value(p.name)} | ${value(input.lead.email)}${p.phone?' | '+value(p.phone):''}\n\nThe attached PDF includes the full requirements and contact details. Please let me know whether you can help source this product and what additional information you need.\n\nThanks,\nEric Crews\nRarewood Exchange\nrarewoodexchange.com\n\nReference: ${lead.reference}`};
 }
 const supplier=input.lead;
 return {subject:`Seller inquiry: ${singleLine(supplier.productName)} | ${lead.reference}`.slice(0,200),body:`Hello,\n\nPlease review this seller inquiry from Rarewood Exchange.\n\nProduct: ${value(supplier.productName)}\nAvailable quantity: ${value(supplier.quantity)} ${value(supplier.unit)}\nLocation: ${value(supplier.location)}\nTiming: ${value(supplier.availability)}\nSeller: ${value(supplier.company||supplier.name)}\nContact: ${value(supplier.name)} | ${value(supplier.phone)}${supplier.email?' | '+value(supplier.email):''}\n\nThe attached PDF includes the inventory details and contact information. Please confirm current availability with the seller and let me know whether you can help locate a buyer.\n\nThanks,\nEric Crews\nRarewood Exchange\nrarewoodexchange.com\n\nReference: ${lead.reference}`};
}
export function gmailComposeUrl(subject:string,body:string,recipient=PRIMARY_BROKER.email as string){
 return 'https://mail.google.com/mail/?'+new URLSearchParams({view:'cm',fs:'1',to:recipient,su:subject,body});
}
export function bytesBase64(bytes:Uint8Array){let binary='';for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));return btoa(binary);}
const utf8=(value:string)=>bytesBase64(new TextEncoder().encode(value));
const wrap=(value:string)=>value.match(/.{1,76}/g)?.join('\r\n')||'';
export function brokerMime(input:{sender:string;subject:string;body:string;pdfBase64:string;filename:string;messageId:string;recipient?:{name:string;email:string}}){
 const recipient=input.recipient||PRIMARY_BROKER;
 if(/[\r\n]/.test(recipient.name+recipient.email)||!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient.email))throw new Error('Invalid recipient.');
 if(/[\r\n]/.test(input.sender+input.subject+input.filename+input.messageId)||!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(input.sender))throw new Error('Invalid email headers.');
 if(!/^[A-Za-z0-9_-]+\.pdf$/.test(input.filename)||!/^[-a-zA-Z0-9]+$/.test(input.messageId))throw new Error('Invalid attachment metadata.');
 const boundary='rwx-'+crypto.randomUUID();
 const chars=Array.from(input.subject),words=[];
 for(let i=0;i<chars.length;i+=11)words.push('=?UTF-8?B?'+utf8(chars.slice(i,i+11).join(''))+'?=');
 const mime=[`To: ${recipient.name} <${recipient.email}>`,`From: ${input.sender}`,`Subject: ${words.join('\r\n ')}`,'MIME-Version: 1.0',`Message-ID: <${input.messageId}@rarewoodexchange.com>`,`Content-Type: multipart/mixed; boundary="${boundary}"`,'',`--${boundary}`,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(utf8(input.body)),`--${boundary}`,'Content-Type: application/pdf',`Content-Disposition: attachment; filename="${input.filename}"`,'Content-Transfer-Encoding: base64','',wrap(input.pdfBase64),`--${boundary}--`,''].join('\r\n');
 return utf8(mime).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
