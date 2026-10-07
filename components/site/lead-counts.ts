'use client';
import {useEffect,useState} from 'react';
import type {LeadCounts} from '@/lib/lead-counts';
const changed='broker-leads-changed';
export function notifyLeadCountsChanged(){window.dispatchEvent(new Event(changed));}
export function useLeadCounts(initial:LeadCounts|undefined,area:string){
 const [counts,setCounts]=useState<LeadCounts|null>(initial||null);
 useEffect(()=>{if(initial)setCounts(initial);},[initial]);
 useEffect(()=>{
  let active:AbortController|undefined;
  const refresh=()=>{
   active?.abort();active=new AbortController();const controller=active;
   fetch('/api/admin/lead-counts',{cache:'no-store',signal:controller.signal}).then(async response=>{
    if(!response.ok)return;const result=await response.json() as LeadCounts;
    if(!controller.signal.aborted&&Number.isInteger(result.buyers)&&result.buyers>=0&&Number.isInteger(result.suppliers)&&result.suppliers>=0)setCounts(result);
   }).catch(()=>{/* Keep the last confirmed counts during a connection failure. */});
  };
  refresh();window.addEventListener(changed,refresh);window.addEventListener('focus',refresh);
  return()=>{active?.abort();window.removeEventListener(changed,refresh);window.removeEventListener('focus',refresh);};
 },[area]);
 return counts;
}
