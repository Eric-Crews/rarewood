import {jsPDF} from 'jspdf';
import {briefFilename,type BrokerBrief} from './broker-brief';

let fontPromise:Promise<string>|undefined;
async function loadFont(){
 if(!fontPromise)fontPromise=(async()=>{
  const response=await fetch('/fonts/broker-brief-sans.ttf');
  if(!response.ok)throw new Error('The PDF font could not be loaded. Please try again.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  let binary='';for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
  return btoa(binary);
 })().catch(error=>{fontPromise=undefined;throw error;});
 return fontPromise;
}
// Plain selectable text, with wrapping and page breaks for long requirements.
// Runs only after an export click, without adding work to the hosting server.
export function createBrokerPdf(brief:BrokerBrief,fontBase64:string){
 const doc=new jsPDF({unit:'pt',format:'letter',compress:true,putOnlyUsedFonts:true});
 doc.addFileToVFS('BrokerBriefSans.ttf',fontBase64);
 doc.addFont('BrokerBriefSans.ttf','BrokerBriefSans','normal');
 doc.setFont('BrokerBriefSans','normal');
 doc.setProperties({title:`${brief.reference} - ${brief.title}`,subject:'Broker review brief',author:'Rarewood Exchange',creator:'Rarewood Exchange'});
 const margin=48,width=516,bottom=738,lineHeight=14;
 let y=margin;
 function header(continued=false){
  doc.setFontSize(10);doc.setTextColor(0);doc.text('RAREWOOD EXCHANGE',margin,y);y+=24;
  doc.setFontSize(17);doc.text(brief.title+(continued?' - continued':''),margin,y);y+=21;
  doc.setFontSize(9);doc.text('Broker review | '+brief.reference,margin,y);y+=16;
  doc.setDrawColor(190);doc.line(margin,y,margin+width,y);y+=20;
 }
 function newPage(){doc.addPage();y=margin;header(true);}
 function ensure(height:number){if(y+height>bottom)newPage();}
 function write(value:string,size=10.5){
  doc.setFontSize(size);
  const lines=doc.splitTextToSize(value.replace(/\r\n?/g,'\n').replace(/\t/g,'    '),width) as string[];
  for(const line of lines){ensure(lineHeight);doc.setFontSize(size);doc.text(line,margin,y);y+=lineHeight;}
 }
 header();
 for(const section of brief.sections){
  ensure(44);doc.setFontSize(12);doc.text(section.title,margin,y);y+=20;
  for(const [label,value] of section.fields){write(label?`${label}: ${value}`:value);y+=3;}
  y+=9;
 }
 const total=doc.getNumberOfPages();
 for(let page=1;page<=total;page++){
  doc.setPage(page);doc.setFontSize(8);doc.setTextColor(90);
  doc.text('rarewoodexchange.com | '+brief.reference,margin,765);
  doc.text(`Page ${page} of ${total}`,564,765,{align:'right'});
 }
 return doc;
}
export async function downloadBrokerPdf(brief:BrokerBrief){
 const {blob,filename}=await brokerPdfAttachment(brief);
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=filename;link.hidden=true;
 document.body.appendChild(link);
 try{link.click();}catch(error){URL.revokeObjectURL(url);throw error;}finally{link.remove();}
 return {url,filename};
}
export async function brokerPdfAttachment(brief:BrokerBrief){
 const doc=createBrokerPdf(brief,await loadFont());
 return {blob:doc.output('blob'),filename:briefFilename(brief)};
}
