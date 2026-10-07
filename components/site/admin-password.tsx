'use client';
import {useState,type FormEvent} from 'react';
import {LockKeyhole,ArrowRight,Loader2} from 'lucide-react';

export function AdminPasswordForm({configured}:{configured:boolean}) {
  const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function unlock(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    try {
      const response=await fetch('/api/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),cache:'no-store'});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Unable to unlock the workspace. Please try again.');
      setPassword('');window.location.assign('/admin');
    }catch(cause){setError(cause instanceof Error?cause.message:'Unable to connect. Please try again.');setBusy(false);}
  }
  return <section className="admin-password-panel"><LockKeyhole size={30} aria-hidden="true"/><span className="eyebrow">PUBLISHER WORKSPACE</span><h1>Unlock your workspace.</h1><p>Enter the administrator password to manage content and review leads.</p>{configured?<form onSubmit={unlock}><label className="field"><span>Administrator password</span><input type="password" name="password" autoComplete="current-password" autoFocus required maxLength={1024} value={password} onChange={event=>setPassword(event.target.value)} aria-describedby={error?'admin-password-error':undefined}/></label>{error&&<p id="admin-password-error" role="alert">{error}</p>}<button className="button dark" type="submit" disabled={busy||!password}>{busy?<Loader2 className="spin" size={18}/>:<ArrowRight size={18}/>} {busy?'Unlocking…':'Unlock workspace'}</button></form>:<p role="alert">Password access is being configured. Please try again shortly.</p>}<a href="/">Return to the website</a></section>;
}

export function AdminLockButton(){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function lock(){setBusy(true);setError('');try{const response=await fetch('/api/admin/auth',{method:'DELETE',cache:'no-store'});if(!response.ok)throw new Error();window.location.assign('/admin');}catch{setError('Unable to lock. Please try again.');setBusy(false);}}
  return <div className="admin-lock"><button type="button" onClick={lock} disabled={busy}><LockKeyhole size={15}/> {busy?'Locking…':'Lock workspace'}</button>{error&&<small role="alert">{error}</small>}</div>;
}
