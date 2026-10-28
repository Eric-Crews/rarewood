'use client';
import {useState} from 'react';
import {AlertTriangle,Loader2,RefreshCw,Sparkles} from 'lucide-react';
import {isStartingProduct} from '@/lib/catalog-availability';
import type {Product} from '@/lib/types';

export function ProductRegeneration({products,connected,disabled,onRefresh,onStartBatch}:{products:Product[];connected:boolean;disabled:boolean;onRefresh:()=>Promise<void>;onStartBatch:()=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const eligible=products.filter(item=>item.status==='published'&&isStartingProduct(item)&&!item.content.needsClarification);
 async function start(){
  if(busy||!eligible.length)return;
  if(!window.confirm(`Move ${eligible.length} published products into drafts and immediately regenerate them one at a time with OpenAI? Their current public pages will disappear until each new page is generated and republished. The existing Insight articles and topic plans will be preserved.`))return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/reset-products-for-regeneration',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   const result=await response.json() as {reset:number;error?:string};
   if(!response.ok)throw new Error(result.error||'The product catalog could not be moved into drafts.');
   if(!result.reset){setMessage('No published products were available to move into the generation queue.');return;}
   await onRefresh();
   setMessage(`${result.reset} products moved to drafts. Starting the OpenAI queue now; pages will republish one by one as generation succeeds.`);
   onStartBatch();
  }catch(error){setMessage(error instanceof Error?error.message:'The regeneration queue could not be started.');}
  finally{setBusy(false);}
 }
 return <section className="publisher-batch publisher-regeneration" aria-label="Regenerate all product pages">
  <div className="publisher-regeneration-title"><Sparkles size={17}/><h3>Regenerate all product pages</h3></div>
  <p>Move the currently published catalog into drafts, then run the existing gpt-5-mini product generator one page at a time. New product copy is published only after its generation succeeds.</p>
  <p className="publisher-regeneration-warning"><AlertTriangle size={15}/> The public product pages will be hidden during processing and return one by one. Keep this admin tab open; you can pause the queue after the current page and resume later.</p>
  {message&&<p role="status">{message}</p>}
  <button className="button outline" disabled={disabled||!connected||busy||!eligible.length} onClick={start}>{busy?<Loader2 size={15} className="spin"/>:<RefreshCw size={15}/>} {busy?'Preparing product queue…':`Reset and regenerate ${eligible.length} published products`}</button>
 </section>;
}
