'use client';
import {useId} from 'react';
import {Checkbox} from '@/components/ui/checkbox';

export function SourcingConsent({checked,onChange,disabled=false,className=''}:{checked:boolean;onChange:(checked:boolean)=>void;disabled?:boolean;className?:string}){
  const id=useId();
  return <div className={`sourcing-consent ${className}`}>
    <Checkbox id={id} name="consent" checked={checked} disabled={disabled} onCheckedChange={value=>onChange(value===true)} aria-required="true"/>
    <label htmlFor={id}>I agree that AdvGuides, LLC may store this request and share these details with a relevant lumber broker for sourcing follow-up. <a href="/privacy" target="_blank" rel="noreferrer">Privacy policy</a>.</label>
  </div>;
}
