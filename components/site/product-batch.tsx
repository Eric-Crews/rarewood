'use client';
import {useEffect,useRef,useState} from 'react';
import {batchProductAllowed,pendingBatchProducts,pendingBatchInsights,pendingBatchTaxonomy,taxonomyNeedsGeneration} from '@/lib/batch-queue';
import type {Product,Post} from '@/lib/types';
type Library={products:Product[];posts:Post[]};
type Failure={name:string;message:string};
class BatchRequestError extends Error {constructor(message:string,public status:number){super(message);}}
async function request<T>(action:string,payload?:unknown):Promise<T>{
 const response=await fetch(`/api/admin/${action}`,payload===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 let data:T&{error?:string};try{data=await response.json();}catch{throw new BatchRequestError('The server returned an unreadable response. Saved pages will be skipped when resumed.',response.status);}
 if(!response.ok)throw new BatchRequestError(data.error||'This item could not be completed.',response.status);
 return data;
}
export function ProductBatch({products,posts,connected,disabled,onRefresh,mode='products'}:{mode?:'products'|'insights'|'taxonomy';products:Product[];posts:Post[];connected:boolean;disabled:boolean;onRefresh:()=>Promise<void>}){
 const [running,setRunning]=useState(false),[current,setCurrent]=useState(''),[completed,setCompleted]=useState(0),[total,setTotal]=useState(0),[phase,setPhase]=useState('Products'),[message,setMessage]=useState(''),[failures,setFailures]=useState<Failure[]>([]),[published,setPublished]=useState(0);
 const stop=useRef(false),active=useRef(false),mounted=useRef(true);
 const productCount=pendingBatchProducts(products).length;
 const missingPlans=products.filter(item=>batchProductAllowed(item)&&item.status==='published'&&!item.content.blogTopics?.length).length;
 const insightCount=pendingBatchInsights(products,posts).length;
 const insightMode=mode==='insights';
 const taxonomyMode=mode==='taxonomy',taxonomyQueue=pendingBatchTaxonomy(posts),taxonomyCount=taxonomyQueue.length,taxonomyToGenerate=taxonomyQueue.filter(taxonomyNeedsGeneration).length;
 const waitingCount=posts.filter(post=>post.status==='draft'&&(!post.content.pageType||post.content.pageType==='article')&&products.some(item=>item.slug===post.content.primaryProduct&&item.status!=='published')).length;
 const workAvailable=taxonomyMode?taxonomyCount>0:(!insightMode&&productCount>0)||missingPlans>0||(insightMode&&insightCount>0);
 useEffect(()=>{mounted.current=true;const guard=(event:BeforeUnloadEvent)=>{if(active.current){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>{mounted.current=false;stop.current=true;window.removeEventListener('beforeunload',guard);};},[]);
 async function start(){
  if(active.current)return;active.current=true;stop.current=false;setRunning(true);setCompleted(0);setPublished(0);setFailures([]);setMessage('');
  let publishedCount=0,failedCount=0;
  async function processQueue<T>(label:string,queue:T[],name:(item:T)=>string,action:string,payload:(item:T)=>unknown){
   setPhase(label);setTotal(queue.length);setCompleted(0);
   for(let index=0;index<queue.length;index++){
    if(stop.current)break;const item=queue[index];setCurrent(name(item));
    try{const result=await request<{published?:boolean;skipped?:boolean}>(action,payload(item));if(result.published){publishedCount++;setPublished(publishedCount);}}
    catch(error){const detail=error instanceof Error?error.message:'Unable to complete this item.';failedCount++;setFailures(previous=>[...previous,{name:name(item),message:detail}]);
     if(error instanceof BatchRequestError&&(error.status===401||error.status===403))throw error;
    }
    setCompleted(index+1);
   }
  }
  const execute=async()=>{try{
   await request('sync-content-drafts',{});
   const initial=await request<Library>('data');
   if(taxonomyMode){
    await processQueue('Topics & taxonomy',pendingBatchTaxonomy(initial.posts),item=>item.title,'generate-batch-taxonomy',item=>({id:item.id}));
    setMessage(`${stop.current?'Paused after the current request.':'Collection batch finished.'} ${publishedCount} pages published.${failedCount?` ${failedCount} items need retry; see details below.`:''} Start again to pick up unfinished work.`);
    return;
   }
   if(!insightMode)await processQueue('Products',pendingBatchProducts(initial.products),item=>item.name,'generate-batch-item',item=>({id:item.id}));
   if(mounted.current)await onRefresh().catch(()=>{});
   if(!stop.current){
    let fresh=await request<Library>('data');
    const plans=fresh.products.filter(item=>batchProductAllowed(item)&&item.status==='published'&&!item.content.blogTopics?.length);
    await processQueue('Insight topic plans',plans,item=>item.name,'generate-batch-topics',item=>({id:item.id}));
    if(!stop.current)await request('sync-content-drafts',{});
    if(insightMode&&!stop.current){fresh=await request<Library>('data');await processQueue('Supporting Insights',pendingBatchInsights(fresh.products,fresh.posts),item=>item.title,'generate-batch-insight',item=>({productId:item.productId,topicSlug:item.topicSlug}));}
   }
   setMessage(`${stop.current?'Paused after the current request.':(insightMode?'Insights batch finished.':'Product batch finished. Supporting Insights are saved as drafts.')} ${publishedCount} pages published.${failedCount?` ${failedCount} items need retry; see details below.`:''} Start again to pick up unfinished work.`);
  }catch(error){setMessage(`${error instanceof Error?error.message:'Batch stopped.'} ${publishedCount} pages are already published. Resume to continue from saved progress.`);}finally{if(mounted.current)await onRefresh().catch(()=>{});}};
  try{if(navigator.locks)await navigator.locks.request('rarewood-product-batch',{ifAvailable:true},async lock=>{if(!lock){setMessage('A batch is already running in another tab.');return;}await execute();});else await execute();}finally{active.current=false;if(mounted.current){setRunning(false);setCurrent('');}}
 }
 return <section className="publisher-batch"><h3>{taxonomyMode?'Generate & publish collections':insightMode?'Generate & publish Insights':'Generate & publish products'}</h3><p>{taxonomyMode?`${taxonomyCount} collections ready · ${taxonomyToGenerate} need content · ${taxonomyCount-taxonomyToGenerate} ready to publish`:insightMode?`${insightCount} Insights ready to process · ${waitingCount} waiting for products`:`${productCount} products ready · three Insight drafts per topic plan`}{!taxonomyMode&&missingPlans?` · ${missingPlans} topic plans needed`:''}</p><p>{taxonomyMode?'Generate and publish categories, tags and topics one at a time, including their SEO copy and FAQs. Completed drafts publish as saved. Published pages are skipped.':insightMode?'Generate one complete article at a time, publish it, then continue. Every Insight links back to its product. Existing completed drafts publish without regeneration.':'Publish product pages and automatically save their three supporting Insights as drafts. Run the separate Insights queue when you’re ready.'}</p>{taxonomyMode&&<p>Collections can publish before their products. Product cards appear as each product goes live.</p>}<p>Publishing is pre-approved. Keep this tab open. Uses gpt-6-luna.{!taxonomyMode&&!insightMode&&' Future products need broker confirmation; unclear labels are skipped.'}</p>{running&&<><progress value={completed} max={total||1}/><p role="status">{phase}: {completed} / {total} processed · {published} pages published</p><p>{current||'Preparing queue…'}</p></>}{message&&<p role="status">{message}</p>}<button className="button dark" disabled={disabled||!connected||running||!workAvailable} onClick={start}>{taxonomyMode?'Start / resume collections':insightMode?'Start / resume Insights':'Start / resume publishing'}</button>{running&&<button className="button outline" onClick={()=>{stop.current=true;setMessage('Pausing after the current request finishes…');}}>Pause after current</button>}{failures.length>0&&<details className="publisher-batch-errors"><summary>{failures.length} items to retry</summary><ul>{failures.map((failure,index)=><li key={index}><b>{failure.name}</b><span>{failure.message}</span></li>)}</ul></details>}<p><a href="/sitemap.xml" target="_blank" rel="noreferrer">View live sitemap</a> · Updates automatically as pages publish.</p></section>;
}
