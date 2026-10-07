'use client';
import {useEffect,useId,useState} from 'react';
import {Download,Loader2} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {buyerBrief,supplierBrief} from '@/lib/broker-brief';
import type {Lead} from '@/lib/types';
import type {SupplierLead} from '@/lib/supplier-leads';
type Props=({kind:'buyer';lead:Lead}|{kind:'supplier';lead:SupplierLead})&{disabled?:boolean};
export function BrokerExport(props:Props){
 const id=useId(),[includeNotes,setIncludeNotes]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[file,setFile]=useState<{url:string;filename:string}|null>(null);
 useEffect(()=>()=>{if(file)URL.revokeObjectURL(file.url);},[file]);
 async function download(){
  setBusy(true);setError('');
  try{
   const brief=props.kind==='buyer'?buyerBrief(props.lead,includeNotes):supplierBrief(props.lead,includeNotes);
   const {downloadBrokerPdf}=await import('@/lib/broker-pdf');
   setFile(await downloadBrokerPdf(brief));
  }catch(cause){setError(cause instanceof Error?cause.message:'The PDF could not be created. Please try again.');}
  finally{setBusy(false);}
 }
 return <div className="broker-export"><div className="sourcing-consent"><Checkbox id={id} checked={includeNotes} disabled={busy||props.disabled} onCheckedChange={value=>setIncludeNotes(value===true)}/><label htmlFor={id}>Include internal follow-up notes in the PDF</label></div><button type="button" className="button outline" disabled={busy||props.disabled} onClick={download}>{busy?<Loader2 size={16} className="spin"/>:<Download size={16}/>} {busy?'Creating PDF…':'Export PDF'}</button>{file&&<p role="status">PDF ready. <a className="text-link" href={file.url} download={file.filename}>Download again</a></p>}{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}
