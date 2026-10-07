'use client';
import {useState} from 'react';
import type {IllustrationAsset} from '@/lib/product-illustrations';
import styles from './illustration-image.module.css';

/** Tries family → category → botanical, including real network/decoding errors. */
export function IllustrationImage({candidates,className='',decorative=true,sizes='(max-width: 600px) 96px, 144px'}:{candidates:IllustrationAsset[];className?:string;decorative?:boolean;sizes?:string}){
  const [failed,setFailed]=useState<string[]>([]);
  const current=candidates.find(candidate=>!failed.includes(candidate.src));
  if(!current)return <span className={`${styles.empty} ${className}`} aria-hidden="true"/>;
  return <img className={`${styles.image} ${className}`} src={current.src} srcSet={current.srcSet} sizes={sizes} width={current.width} height={current.height} alt={decorative?'':current.alt} aria-hidden={decorative||undefined} loading="lazy" decoding="async" data-image-id={current.imageId} data-illustration-level={current.level} onError={()=>setFailed(previous=>previous.includes(current.src)?previous:[...previous,current.src])}/>;
}
