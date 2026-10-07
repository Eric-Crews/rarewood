'use client';
import {useState} from 'react';
import {Search} from 'lucide-react';
import {IllustrationImage} from './illustration-image';
import {productIllustrations} from '@/lib/product-illustrations';
import artwork from './product-artwork.module.css';
import type {SellProduct} from '@/lib/supplier-content';
import styles from '@/app/sell/sell.module.css';
export function SellCatalog({items}:{items:SellProduct[]}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All products');
 const filtered=items.filter(item=>(category==='All products'||item.category===category)&&`${item.name} ${item.aliases.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <div id="sell-directory"><div className={styles.directoryHead}><label className="search-field"><Search size={20}/><input aria-label="Search products to sell" value={query} onChange={event=>setQuery(event.target.value)} placeholder="What do you have available?"/></label><span aria-live="polite">{filtered.length} products</span></div><div className={`category-tabs ${styles.filters}`}>{['All products',...new Set(items.map(item=>item.category))].map(value=><button type="button" key={value} className={value===category?'selected':''} aria-pressed={value===category} onClick={()=>setCategory(value)}>{value}</button>)}</div><div className={styles.catalogGrid}>{filtered.map(item=><a href={`/sell/${item.slug}`} key={item.id} className={styles.catalogCard}><span className={artwork.sellerArt}><IllustrationImage candidates={productIllustrations(item)} sizes="60px"/></span><h3>{item.name}</h3><span>Share available inventory</span></a>)}</div>{!filtered.length&&<p className={styles.empty}>No matching products. Try another name or <button type="button" className="text-link" onClick={()=>{setQuery('');setCategory('All products');}}>clear the filters</button>.</p>}</div>;
}
