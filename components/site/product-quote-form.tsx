'use client';
import {useState} from 'react';
import {ArrowLeft,Check,LockKeyhole} from 'lucide-react';
import {SourcingConsent} from './sourcing-consent';

const initial={volume:'',unit:'Board feet',frequency:'One-time purchase',destination:'',company:'',name:'',email:'',phone:'',details:'',dimensions:'',application:'',grade:'',receiving:'',timing:'Within 30 days',contactFax:''};

export function ProductQuoteForm({product,defaultDestination='',defaultUnit='Board feet'}:{product:string;defaultDestination?:string;defaultUnit?:string}){
  const [form,setForm]=useState(()=>({...initial,unit:defaultUnit,destination:defaultDestination.slice(0,300)}));
  const [step,setStep]=useState(1);
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [reference,setReference]=useState('');
  const [requestKey]=useState(()=>crypto.randomUUID());
  const change=(key:keyof typeof initial,value:string)=>setForm(current=>({...current,[key]:value}));

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;setError('');
    if(step===1){setStep(2);return;}
    if(!consent){setError('Please agree to share this request for sourcing follow-up.');return;}
    setBusy(true);
    try{
      const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        requestKey,product,...form,volume:Number(form.volume),grade:form.grade||'To discuss',application:form.application||'To discuss',packaging:'',website:'',consent,
      })});
      const data=await response.json() as {error?:string;reference?:string};
      if(!response.ok||!data.reference)throw new Error(data.error||'Your request could not be saved.');
      setReference(data.reference);
    }catch(err){setError(err instanceof Error?err.message:'Please try again.');}
    finally{setBusy(false);}
  }

  if(reference)return <div className="product-quote-success" role="status"><span><Check/></span><p className="eyebrow">REQUEST RECEIVED</p><h2>Your sourcing brief is in.</h2><p>A broker can review your {product} requirements and follow up using the contact details you provided.</p><small>Reference <b>{reference}</b></small></div>;

  const field=(key:keyof typeof initial,label:string,placeholder:string,type='text')=><label className="field"><span>{label}</span><input required value={form[key]} onChange={e=>change(key,e.target.value)} placeholder={placeholder} type={type} min={type==='number'?0.01:undefined} step={type==='number'?'any':undefined}/></label>;
  return <form className="product-quote-form" onSubmit={submit}>
    <div className="product-quote-head"><span className="eyebrow">DELIVERED QUOTE REQUEST</span><h2>Price {product}.</h2><p>Two short steps. Your requirements stay attached to the inquiry.</p></div>
    <div className="product-quote-progress" aria-label={`Step ${step} of 2`}><i className="active"/><i className={step===2?'active':''}/></div>
    {step===1?<div className="product-form-step">
      <div className="form-grid">{field('volume','Quantity','e.g. 3','number')}<label className="field"><span>Unit</span><select value={form.unit} onChange={e=>change('unit',e.target.value)}>{['Board feet','Linear feet','Square feet','Sheets','Slabs','Pieces','Truckloads'].map(unit=><option key={unit}>{unit}</option>)}</select></label></div>
      {field('dimensions','Dimensions or profile','e.g. 4/4 rough; 1×6 decking; or to discuss')}
      {field('application','Intended use','Furniture, decking, cabinetry, or another use')}
      {field('destination','Delivery destination','ZIP, city, state, or region')}
      <label className="field"><span>Target timing</span><select value={form.timing} onChange={e=>change('timing',e.target.value)}>{['As soon as available','Within 30 days','1–3 months','Planning ahead'].map(t=><option key={t}>{t}</option>)}</select></label>
      <label className="field"><span>Purchasing frequency</span><select value={form.frequency} onChange={e=>change('frequency',e.target.value)}><option>One-time purchase</option><option>Monthly</option><option>Quarterly</option><option>Annual program</option></select></label>
      <button className="button lime product-form-submit" type="submit">Continue to contact details</button>
    </div>:<div className="product-form-step">
      <button type="button" className="product-form-back" onClick={()=>setStep(1)}><ArrowLeft size={15}/> Edit requirements</button>
      <div className="form-grid">{field('name','Contact name','First and last name')}{field('company','Company','Business or personal project')}</div>
      {field('email','Email','name@company.com','email')}
      {field('phone','Phone','For sourcing follow-up','tel')}
      <label className="field"><span>Specs or questions <small>Optional</small></span><textarea rows={3} value={form.details} onChange={e=>change('details',e.target.value)} placeholder="Grade, moisture condition, length selection, unloading equipment, or delivery access"/></label>
      <label className="honeypot" aria-hidden="true">Fax<input tabIndex={-1} autoComplete="off" value={form.contactFax} onChange={e=>change('contactFax',e.target.value)}/></label>
      <SourcingConsent className="product-consent" checked={consent} onChange={setConsent} disabled={busy}/>
      <button className="button lime product-form-submit" type="submit" disabled={busy}>{busy?'Saving request…':'Request pricing & availability'}</button>
    </div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    <p className="product-form-fine"><LockKeyhole size={14}/> No payment required. A broker confirms availability and commercial terms.</p>
  </form>;
}
