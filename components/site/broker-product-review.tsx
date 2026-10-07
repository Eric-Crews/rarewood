'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Check,LockKeyhole,Search,RefreshCw,X,Wheat} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import type {BrokerReviewData,BrokerReviewItem,ReviewAnswer} from '@/lib/broker-review-types';
import styles from './broker-review.module.css';

async function api(path:string,body?:unknown){
 const response=await fetch(`/api/broker-review/${path}`,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error((data as {error?:string}).error||'Unable to save. Please try again.'),{status:response.status});return data;
}
export function BrokerProductReview(){
 const [data,setData]=useState<BrokerReviewData|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[locked,setLocked]=useState(false),[notice,setNotice]=useState(''),[pending,setPending]=useState(''),[filter,setFilter]=useState('unanswered'),[sort,setSort]=useState('az'),[query,setQuery]=useState('');
 const inFlight=useRef(false),initializing=useRef(false),listRef=useRef<HTMLDivElement>(null);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const result=await api('items') as BrokerReviewData;setData(result);setLocked(false);}catch(cause){const error=cause as Error&{status?:number};setError(error.message);if(error.status===401){setLocked(true);setData(null);}}finally{setLoading(false);}},[]);
 useEffect(()=>{
  if(initializing.current)return;initializing.current=true;
  const token=new URLSearchParams(window.location.hash.slice(1)).get('access');
  // A fragment is never sent to the server or a referrer. Remove it immediately
  // before exchanging it for an HttpOnly cookie; never retain it in browser storage.
  if(token)window.history.replaceState(null,'',window.location.pathname);
  (async()=>{try{if(token)await api('connect',{token});await load();}catch(cause){setLocked(true);setError(cause instanceof Error?cause.message:'Unable to open this review link.');setLoading(false);}})();
 },[load]);
 useEffect(()=>{const focus=()=>{if(!inFlight.current&&!locked&&data)void load();};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[data,locked,load]);
 async function answer(item:BrokerReviewItem,answer:ReviewAnswer){
  if(inFlight.current||item.answer===answer)return;inFlight.current=true;setPending(item.id);setError('');setNotice('');
  try{
   const {item:saved}=await api('answer',{id:item.id,answer,updatedAt:item.updatedAt,revision:item.revision,actionId:crypto.randomUUID()}) as {item:BrokerReviewItem};
   setData(current=>current?{...current,items:current.items.map(row=>row.id===saved.id?saved:row)}:current);
   setNotice(`${item.name}: ${answer==='yes'?'Yes':'No'} saved. ${saved.catalogState==='published'?'The live page remains unchanged; the publisher can review this answer.':answer==='yes'?'Ready in Drafts.':'Kept in Future products.'}`);
   if(filter==='unanswered')requestAnimationFrame(()=>listRef.current?.querySelector<HTMLButtonElement>('button[data-answer="yes"]')?.focus({preventScroll:true}));
  }catch(cause){setError(cause instanceof Error?cause.message:'The answer could not be confirmed. Refresh to check before trying again.');}
  finally{inFlight.current=false;setPending('');}
 }
 const items=data?.items||[],answered=items.filter(item=>item.answer),yes=items.filter(item=>item.answer==='yes').length,no=items.filter(item=>item.answer==='no').length;
 const filtered=items.filter(item=>(filter==='unanswered'?!item.answer:filter==='answered'?!!item.answer:true)&&`${item.name} ${item.category} ${item.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='recent'?(b.answeredAt||'').localeCompare(a.answeredAt||'')||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
 return <main id="main" className={styles.page}>
  <header className={styles.masthead}><a href="/" className={styles.brand}><Wheat size={26}/> Rarewood Exchange<span>.</span></a><span><LockKeyhole size={14}/> Private broker review</span></header>
  <div className={styles.workspace}><div className={styles.heading}><div><span className={styles.eyebrow}>PRODUCT AVAILABILITY</span><h1>What can you source?</h1><p>Choose Yes or No for each product. Every answer is saved, so you can return whenever you’re ready.</p></div>{data&&<div className={styles.reviewer}><span>Reviewing as</span><b>{data.reviewer}</b><button onClick={async()=>{try{await api('disconnect',{});setData(null);setLocked(true);setNotice('Review closed. Reopen your private link to continue.');}catch(cause){setError(cause instanceof Error?cause.message:'Unable to close this review.');}}} disabled={!!pending}>Close review</button></div>}</div>
  {locked?<section className={styles.locked}><LockKeyhole size={30}/><h2>A private link is required.</h2><p>{error||notice||'Open the review link shared by Rarewood Exchange. Your previous answers will be here when you return.'}</p></section>:<>
   {data&&<><section className={styles.progress} aria-label="Review progress"><div className={styles.progressMain}><b>{answered.length}<span> / {items.length}</span></b><span>products reviewed</span><progress value={answered.length} max={items.length||1}/></div><div><b>{items.length-answered.length}</b><span>Not answered</span></div><div><b>{yes}</b><span>Yes · can source</span></div><div><b>{no}</b><span>No · unavailable</span></div></section>
   <div className={styles.instructions}><span><Check size={16}/><b>Yes</b> moves the product into Drafts.</span><span><X size={16}/><b>No</b> keeps it in Future products.</span></div>
   <div className={styles.controls}><div className={styles.tabs} role="group" aria-label="Filter answers">{[['unanswered','Not Answered',items.length-answered.length],['answered','Previously Answered',answered.length],['all','All',items.length]].map(([value,label,count])=><button key={value} aria-pressed={filter===value} onClick={()=>{setFilter(String(value));setNotice('');}}>{label}<span>{count}</span></button>)}</div><div className={styles.searchRow}><label className={styles.search}><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search products or categories" aria-label="Search products"/></label><label className={styles.sort}><span>Sort</span><select value={sort} onChange={event=>setSort(event.target.value)}><option value="az">A–Z</option><option value="recent">Recently answered</option></select></label><button className={styles.refresh} disabled={loading||!!pending} onClick={()=>void load()} aria-label="Refresh review"><RefreshCw size={18}/></button></div></div></>}
   <div className={styles.feedback} aria-live="polite">{notice&&<p className={styles.notice}><Check size={17}/>{notice}</p>}{error&&<p className={styles.error} role="alert">{error} <button onClick={()=>void load()} disabled={!!pending}>Refresh list</button></p>}{loading&&<p>Loading the latest review…</p>}</div>
   {data&&<div className={styles.list} ref={listRef}><Table className={styles.table}><TableHeader><TableRow><TableHead>Product <span>({filtered.length})</span></TableHead><TableHead>Category</TableHead><TableHead>Can you source it?</TableHead><TableHead>Last answer</TableHead></TableRow></TableHeader><TableBody>{filtered.map(item=><TableRow key={item.id}><TableCell><b className={styles.product}>{item.name}</b>{item.aliases.length>0&&<span className={styles.aliases}>{item.aliases.join(' · ')}</span>}{item.needsClarification&&<span className={styles.clarification}>Exact product needs clarification</span>}</TableCell><TableCell className={styles.category}>{item.category}</TableCell><TableCell><div className={styles.answers} role="group" aria-label={`Availability for ${item.name}`}><button data-answer="yes" disabled={!!pending||loading} aria-label={`Yes, can source ${item.name}`} aria-pressed={item.answer==='yes'} onClick={()=>void answer(item,'yes')}><Check size={16}/>Yes</button><button data-answer="no" disabled={!!pending||loading} aria-label={`No, cannot source ${item.name}`} aria-pressed={item.answer==='no'} onClick={()=>void answer(item,'no')}><X size={16}/>No</button></div></TableCell><TableCell className={styles.saved}>{pending===item.id?<b>Saving…</b>:item.answeredAt?<><b>{item.answer==='yes'?'Yes':'No'} · saved</b><time dateTime={item.answeredAt}>{new Date(item.answeredAt).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}</time><span>{item.catalogState==='published'?'Published · changes need publisher review':item.catalogState==='draft'?'In Drafts':'In Future products'}</span></>:<span>Not answered</span>}</TableCell></TableRow>)}</TableBody></Table>{!filtered.length&&<div className={styles.empty}><Check size={28}/><h2>{query?'No matching products':filter==='unanswered'?'You’re all caught up.':'No answers here yet.'}</h2><p>{query?'Try another product name or category.':filter==='unanswered'?'You can revisit your decisions under Previously Answered.':'Choose Yes or No to start recording availability.'}</p></div>}</div>}
  </>}<footer className={styles.footnote}>Availability review for catalog planning. Specifications, pricing and delivery are confirmed for each order.</footer></div>
 </main>;
}
