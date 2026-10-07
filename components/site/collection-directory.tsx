'use client';
import {useState} from 'react';
import {ArrowRight,Search,X} from 'lucide-react';
import {filterCollections,type DirectoryCollection} from '@/lib/collection-directory';
import {IllustrationImage} from './illustration-image';
import styles from '@/app/collections/collections.module.css';

function CollectionCard({item,compact=false}:{item:DirectoryCollection;compact?:boolean}){
  const [failedImage,setFailedImage]=useState('');
  const customImage=item.image&&failedImage!==item.image;
  return <article className={`${styles.card} ${compact?styles.marketCard:''}`}>
    <a href={`/collections/${item.slug}`} className={styles.cardLink}>
      <div className={`${styles.art} ${customImage?styles.photo:''}`}>
        {customImage?<img src={item.image} alt="" width={640} height={400} loading="lazy" decoding="async" onError={()=>setFailedImage(item.image)}/>:<IllustrationImage candidates={item.illustrations} sizes={compact?'(max-width: 620px) 45vw, 220px':'(max-width: 620px) 80vw, 280px'}/>}
        <span className={styles.cardType}>{item.isMarket?'Market':item.kind}</span>
      </div>
      <div className={styles.cardBody}>
        {!compact&&<span className={styles.cardMarket}>{item.market||'Product knowledge'}</span>}
        <h3>{item.title}</h3>
        {!compact&&item.summary&&<p>{item.summary}</p>}
        <div className={styles.cardFoot}><span>{item.productCount>0?`${item.productCount} product${item.productCount===1?'':'s'}`:'Explore collection'}{!compact&&item.insightCount>0&&<small> · {item.insightCount} Insight{item.insightCount===1?'':'s'}</small>}</span><ArrowRight size={20} strokeWidth={1.5} aria-hidden="true"/></div>
      </div>
    </a>
    {customImage&&item.imageCredit&&<small className={styles.credit}>{item.imageCredit}</small>}
  </article>;
}

export function CollectionDirectory({items}:{items:DirectoryCollection[]}){
  const [query,setQuery]=useState(''),[kind,setKind]=useState('all'),[market,setMarket]=useState('');
  const markets=items.filter(item=>item.isMarket);
  const collections=items.filter(item=>!item.isMarket);
  const results=filterCollections(collections,query,kind,market);
  const marketNames=[...new Set(collections.map(item=>item.market).filter(Boolean))].sort();
  const types=[{value:'all',label:'All collections'},{value:'category',label:'Categories'},{value:'topic',label:'Topics'},{value:'tag',label:'Tags'}].filter(type=>type.value==='all'||collections.some(item=>item.kind===type.value));
  const filtered=!!query.trim()||kind!=='all'||!!market;
  function reset(){setQuery('');setKind('all');setMarket('');}
  return <>
    {markets.length>0&&<section className={`${styles.wrap} ${styles.markets}`} aria-labelledby="markets-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>A place to begin</span><h2 id="markets-title">Browse by market.</h2></div><p>Start with the industry you serve.</p></div>
      <div className={styles.marketGrid}>{markets.map(item=><CollectionCard key={item.slug} item={item} compact/>)}</div>
    </section>}
    <section className={`${styles.wrap} ${styles.directory}`} aria-labelledby="collections-title" id="browse-collections">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Explore in more detail</span><h2 id="collections-title">Find your collection.</h2></div><p>Product families, practical topics,<br/>and the products that connect them.</p></div>
      <div className={styles.toolbar}>
        <div className={styles.search}><Search size={20} aria-hidden="true"/><input type="search" aria-label="Search collections" placeholder="Search collections…" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear search"><X size={18}/></button>}</div>
        {marketNames.length>0&&<select aria-label="Filter collections by market" value={market} onChange={event=>setMarket(event.target.value)}><option value="">All markets</option>{marketNames.map(name=><option key={name} value={name}>{name}</option>)}</select>}
      </div>
      <div className={styles.filterRow}><div className={styles.filters} role="group" aria-label="Collection type">{types.map(type=><button key={type.value} type="button" aria-pressed={kind===type.value} onClick={()=>setKind(type.value)}>{type.label}</button>)}</div><p role="status" aria-live="polite">{results.length} collection{results.length===1?'':'s'}</p></div>
      {results.length>0?<div className={styles.grid}>{results.map(item=><CollectionCard key={item.slug} item={item}/>)}</div>:<div className={styles.empty}><h3>{filtered?'No matching collections.':'More collections are on the way.'}</h3><p>{filtered?'Try a broader search or choose another market.':'Explore the product directory to find your next sourcing opportunity.'}</p>{filtered?<button type="button" className="button dark" onClick={reset}>Clear filters</button>:<a href="/products" className="button dark">Explore products</a>}</div>}
      {filtered&&results.length>0&&<button type="button" className={styles.reset} onClick={reset}>Clear all filters</button>}
    </section>
  </>;
}
