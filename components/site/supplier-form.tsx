'use client';
import {useId,useRef,useState} from 'react';
import {CheckCircle2,Loader2} from 'lucide-react';
import {SourcingConsent} from './sourcing-consent';
import {supplierUnits} from '@/lib/supplier-leads';
import type {SellProduct} from '@/lib/supplier-content';
import styles from '@/app/sell/sell.module.css';

export function SupplierForm({item}:{item:SellProduct}){
 const id=useId(),lock=useRef(false),submission=useRef({payload:'',key:''});
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
 const [form,setForm]=useState({quantity:'',unit:'Short tons',location:'',phone:'',name:'',company:'',email:'',availability:'Ready now',details:'',contactFax:''});
 const change=(key:keyof typeof form,value:string)=>setForm(f=>({...f,[key]:value}));
 async function submit(event:React.FormEvent){event.preventDefault();if(lock.current)return;if(!consent){setError('Please agree to broker follow-up before submitting.');return;}lock.current=true;setBusy(true);setError('');try{
  const payload=JSON.stringify({...form,productSlug:item.slug,consent});if(submission.current.payload!==payload)submission.current={payload,key:crypto.randomUUID()};
  const response=await fetch('/api/v1/supplier-leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...JSON.parse(payload),requestKey:submission.current.key}),signal:AbortSignal.timeout(30000)});
  const data=await response.json() as {error?:string;reference?:string};if(!response.ok)throw new Error(data.error||'Your inventory could not be saved.');if(typeof data.reference!=='string'||!data.reference)throw new Error('A confirmation was not received. Please try again.');setReference(data.reference);
 }catch(error){setError(error instanceof Error&&error.name!=='TimeoutError'?error.message:'The connection timed out. Your details are still here; please try again.');}finally{lock.current=false;setBusy(false);}}
 if(reference)return <section id="submit-inventory" className={styles.formCard} aria-labelledby="supplier-confirmation"><div className={styles.confirmation} role="status"><CheckCircle2 size={36}/><span className="eyebrow">SUBMISSION RECEIVED</span><h2 id="supplier-confirmation">Your inventory is saved.</h2><p>Your {item.name.toLowerCase()} availability is in our supplier inbox for review and broker follow-up.</p><strong>{reference}</strong><p>Keep this reference for any updates. A buyer, sale, price, and response time are not guaranteed.</p><a href="/sell" className="button dark">Submit another product</a></div></section>;
 return <section id="submit-inventory" className={styles.formCard} aria-labelledby="supplier-form-title">
  <div className={styles.formHeading}><span className="eyebrow">NO SUBMISSION FEE · NO ACCOUNT NEEDED</span><h2 id="supplier-form-title">Share your availability.</h2><p>{item.name} · Private broker review</p></div>
  <form onSubmit={submit}>
   <fieldset disabled={busy}>
    <legend className={styles.srOnly}>Your {item.name} inventory</legend>
    <div className={styles.formRow}>
     <label className="field" htmlFor={`${id}-quantity`}><span>Quantity available</span><input id={`${id}-quantity`} required type="number" inputMode="decimal" min="0.000001" max="1000000000" step="any" value={form.quantity} onChange={e=>change('quantity',e.target.value)} placeholder="e.g. 25"/></label>
     <label className="field" htmlFor={`${id}-unit`}><span>Unit</span><select id={`${id}-unit`} value={form.unit} onChange={e=>change('unit',e.target.value)}>{supplierUnits.map(unit=><option key={unit}>{unit}</option>)}</select></label>
    </div>
    <label className="field" htmlFor={`${id}-location`}><span>Where is the inventory?</span><input id={`${id}-location`} required minLength={3} maxLength={200} autoComplete="postal-code" value={form.location} onChange={e=>change('location',e.target.value)} placeholder="ZIP / postal code or city, state & country"/></label>
    <label className="field" htmlFor={`${id}-phone`}><span>Phone for broker follow-up</span><input id={`${id}-phone`} required type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="Your phone number"/><small>Outside the US or Canada, include + and the country code.</small></label>
    <label className="field" htmlFor={`${id}-available`}><span>When is it available?</span><select id={`${id}-available`} value={form.availability} onChange={e=>change('availability',e.target.value)}>{['Ready now','Within 30 days','Discuss timing'].map(value=><option key={value}>{value}</option>)}</select></label>
    <details className={styles.optionalDetails}><summary>Add contact and lot details <span>Optional</span></summary>
     <label className="field" htmlFor={`${id}-name`}><span>Your name</span><input id={`${id}-name`} maxLength={150} autoComplete="name" value={form.name} onChange={e=>change('name',e.target.value)}/></label>
     <label className="field" htmlFor={`${id}-company`}><span>Farm or company</span><input id={`${id}-company`} maxLength={200} autoComplete="organization" value={form.company} onChange={e=>change('company',e.target.value)}/></label>
     <label className="field" htmlFor={`${id}-email`}><span>Email</span><input id={`${id}-email`} type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e=>change('email',e.target.value)}/></label>
     <label className="field" htmlFor={`${id}-details`}><span>Form, grade, packaging & loading details</span><textarea id={`${id}-details`} rows={4} maxLength={4000} value={form.details} onChange={e=>change('details',e.target.value)} placeholder="Describe this lot, any available specifications, and pickup or delivery arrangements."/></label>
    </details>
    <div className={styles.honeypot} aria-hidden="true"><label>Leave this field empty<input tabIndex={-1} autoComplete="off" value={form.contactFax} onChange={e=>change('contactFax',e.target.value)}/></label></div>
    <SourcingConsent checked={consent} onChange={setConsent} disabled={busy}/>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <button type="submit" className={`button dark ${styles.submit}`} disabled={busy}>{busy?<><Loader2 className="spin" size={18}/> Saving your inventory…</>:'Submit inventory for free'}</button>
    <p className={styles.formNote}>Your contact details and inventory stay private for review. Submitting does not create a public inventory listing or guarantee a sale.</p>
   </fieldset>
  </form>
 </section>;
}
