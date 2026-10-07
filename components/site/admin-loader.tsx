'use client';
import {useEffect,useState} from 'react';
import {Loader2} from 'lucide-react';
import {AdminWorkspace,type AdminData} from './admin-workspace';

export function AdminLoader(){
 const [data,setData]=useState<AdminData|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setError('');
  async function load(){
   try{
    const response=await fetch('/api/admin/data',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(response.status===401||response.status===403?'Your administrator session has expired. Unlock the workspace again to continue.':'The content library could not be loaded. Please try again.');
    const result=await response.json() as AdminData;
    if(!Array.isArray(result.products)||!Array.isArray(result.posts)||!Array.isArray(result.leads)||!result.connections)throw new Error('The content library returned an incomplete response. Please try again.');
    if(!controller.signal.aborted)setData(result);
   }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'The content library could not be loaded. Please try again.');}
  }
  void load();
  return()=>controller.abort();
 },[attempt]);
 if(data)return <AdminWorkspace initial={data}/>;
 return <section className="publisher-welcome" aria-busy={!error}><small>PUBLISHER WORKSPACE</small><h1>{error?'Unable to open your library':'Opening your content library'}</h1>{error?<><p role="alert">{error}</p><button className="button dark" onClick={()=>setAttempt(value=>value+1)}>Try again</button><a className="button outline" href="/admin">Unlock workspace</a></>:<p role="status"><Loader2 className="spin" size={20} aria-hidden="true"/> Loading products, Insights, and collections…</p>}</section>;
}
