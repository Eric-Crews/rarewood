'use client';
import {useRef,useState} from 'react';
import {Search,SlidersHorizontal,LayoutGrid,List,Leaf,ChartNoAxesColumnIncreasing,Users,X} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {categoryLabel,directoryCategories,featuredCategories,filterDirectory,type DirectoryProduct,type DirectoryHub,type DirectorySort} from '@/lib/product-directory';
import styles from '@/app/products/directory.module.css';
import {categoryIllustrations,productIllustrations} from '@/lib/product-illustrations';
import {IllustrationImage} from './illustration-image';

export function ProductDirectory({items,hubs}:{items:DirectoryProduct[];hubs:DirectoryHub[]}){
  const [query,setQuery]=useState(''),[market,setMarket]=useState('All markets'),[category,setCategory]=useState('All categories');
  const [sort,setSort]=useState<DirectorySort>('name-asc'),[view,setView]=useState('grid'),[visible,setVisible]=useState(20);
  const resultsRef=useRef<HTMLElement>(null);
  const markets=['All markets',...new Set(items.flatMap(item=>item.placements.map(p=>p.market)).filter(Boolean))];
  const categories=directoryCategories(items,market);
  const tiles=[...categories].sort((a,b)=>{const ai=featuredCategories.indexOf(a.name),bi=featuredCategories.indexOf(b.name);return (ai===-1?99:ai)-(bi===-1?99:bi)||a.name.localeCompare(b.name);}).slice(0,10);
  const filtered=filterDirectory(items,market,category,query,sort);
  const isFiltered=query.trim()||market!=='All markets'||category!=='All categories';
  function jump(){resultsRef.current?.scrollIntoView({block:'start'});resultsRef.current?.focus({preventScroll:true});}
  function chooseCategory(value:string){setCategory(value);setVisible(20);jump();}
  function reset(){setQuery('');setMarket('All markets');setCategory('All categories');setVisible(20);}
  return <>
    <section className={styles.hero} aria-labelledby="directory-heading">
      <img className={styles.heroImage} src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="100vw" alt="" width={1672} height={941} fetchPriority="high"/>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}><span className={styles.eyebrow}>The product directory</span><h1 id="directory-heading">What are you<br/><span>sourcing next?</span></h1><p>Explore products for your business. Find the right starting point, then share the specifications that matter.</p></div>

        <form className={styles.search} role="search" onSubmit={event=>{event.preventDefault();jump();}}>
          <Search size={23} aria-hidden="true"/><input type="search" aria-label="Search products, aliases, markets, or categories" placeholder="Search products, aliases, markets, or categories…" value={query} onChange={event=>{setQuery(event.target.value);setVisible(20);}}/>
          {query&&<button className={styles.clearSearch} type="button" onClick={()=>{setQuery('');setVisible(20);}} aria-label="Clear search"><X size={18}/></button>}
          <button className={styles.searchSubmit} type="submit">Search</button>
        </form>
        <div className={styles.marketRow}><span className={styles.eyebrow}>Market</span><div className={styles.marketFilters} role="group" aria-label="Filter by market">{markets.map(value=><button key={value} type="button" aria-pressed={market===value} onClick={()=>{setMarket(value);setCategory('All categories');setVisible(20);}}>{value}</button>)}</div><span className={styles.total} aria-live="polite"><SlidersHorizontal size={17} aria-hidden="true"/>{filtered.length} products</span></div>
      </div>
    </section>
    <section className={styles.categories} aria-labelledby="category-heading">
      <div className={styles.sectionTop}><h2 id="category-heading" className={styles.eyebrow}>Browse by category</h2><a href="/collections">View all categories</a></div>
      <div className={styles.categoryGrid}>{tiles.map(tile=>{const guide=hubs.find(h=>h.category===tile.name&&(market==='All markets'||h.market===market));return <article key={tile.name} className={styles.categoryTile} data-selected={category===tile.name}>
        <div className={styles.categoryArt} aria-hidden="true"><IllustrationImage candidates={categoryIllustrations(tile.name)} sizes="144px"/></div>
        <button type="button" aria-pressed={category===tile.name} onClick={()=>chooseCategory(category===tile.name?'All categories':tile.name)}><span>{categoryLabel(tile.name)}</span><small>{tile.count} products</small></button>
        {guide&&<a className={styles.categoryGuide} href={`/collections/${guide.slug}`}>{guide.market?`${guide.market} guide`:'Category guide'}<span className={styles.srOnly}>: {tile.name}</span></a>}
      </article>;})}</div>
    </section>
    <section className={styles.benefitBand} aria-label="A clearer sourcing process"><div className={styles.benefits}>
      <a href="/collections"><span className={styles.iconRing}><Leaf size={30} strokeWidth={1.3}/></span><div><h2>Source with confidence</h2><p>Explore product categories and compare your requirements.</p></div></a>
      <a href="/insights"><span className={styles.iconRing}><ChartNoAxesColumnIncreasing size={30} strokeWidth={1.5}/></span><div><h2>Make informed decisions</h2><p>Read practical buying guides and sourcing insights.</p></div></a>
      <a href="/request"><span className={styles.iconRing}><Users size={30} strokeWidth={1.5}/></span><div><h2>A stronger supply chain</h2><p>Share your requirements for a more useful broker conversation.</p></div></a>
    </div></section>
    <section className={styles.results} id="product-results" ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading">
      <div className={styles.resultsHeader}>
        <div><h2 id="results-heading">{category!=='All categories'?categoryLabel(category):market!=='All markets'?`${market} products`:'All products'}</h2><p role="status" aria-live="polite">{filtered.length} products{query.trim()?` matching “${query.trim()}”`:''}</p></div>
        <div className={styles.controls}>
          <Select value={category} onValueChange={value=>{setCategory(value);setVisible(20);}}><SelectTrigger className={styles.select} aria-label="Filter by category"><SelectValue>{categoryLabel(category)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="All categories">All categories</SelectItem>{categories.map(c=><SelectItem key={c.name} value={c.name}>{categoryLabel(c.name)}</SelectItem>)}</SelectContent></Select>
          <Select value={sort} onValueChange={value=>{setSort(value as DirectorySort);setVisible(20);}}><SelectTrigger className={styles.select} aria-label="Sort products"><SelectValue>{{'name-asc':'Name A–Z','name-desc':'Name Z–A',category:'Category'}[sort]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="name-asc">Name A–Z</SelectItem><SelectItem value="name-desc">Name Z–A</SelectItem><SelectItem value="category">Category</SelectItem></SelectContent></Select>
          <ToggleGroup type="single" value={view} onValueChange={value=>{if(value)setView(value);}} className={styles.viewToggle} aria-label="Product display"><ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid size={18}/></ToggleGroupItem><ToggleGroupItem value="list" aria-label="List view"><List size={18}/></ToggleGroupItem></ToggleGroup>
        </div>
      </div>
      {isFiltered&&<div className={styles.activeFilters}><span>{[market!=='All markets'?market:'',category!=='All categories'?categoryLabel(category):''].filter(Boolean).join(' · ')||'Search results'}</span><button type="button" onClick={reset}>Clear filters</button></div>}
      {filtered.length?<div className={`${styles.productGrid} ${view==='list'?styles.listView:''}`}>
        {filtered.map((item,index)=>{const label=item.placements.find(p=>market==='All markets'||p.market===market)?.category||item.category;return <article className={styles.productCard} key={item.id} hidden={index>=visible}>
          <a href={`/products/${item.slug}`}><span className={styles.cardCategory}>{categoryLabel(label)}</span><div className={styles.cardArt}>{item.image?<img src={item.image} alt={item.imageAlt} width={240} height={240} loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<IllustrationImage candidates={productIllustrations(item,label)}/>}</div>
          <div className={styles.cardContent}><div className={styles.cardHeading}><h3>{item.name}</h3>{item.status==='draft'&&<span className={styles.preview}>Preview</span>}</div><p>{item.summary}</p>{item.aliases.length>0&&<small className={styles.aliases}>Also known as {item.aliases.slice(0,2).join(', ')}</small>}<span className={styles.cardAction}>{item.status==='draft'?'Preview product':'View product'}</span></div></a>
        </article>;})}
      </div>:<div className={styles.empty}><h3>No matching products.</h3><p>Try a different name or clear the filters to browse the directory.</p><button type="button" className={styles.searchSubmit} onClick={reset}>Clear filters</button><a href="/request">Request sourcing help</a></div>}
      {visible<filtered.length&&<div className={styles.loadMore}><p>Showing {Math.min(visible,filtered.length)} of {filtered.length} products</p><button className={styles.searchSubmit} type="button" onClick={()=>setVisible(current=>current+20)}>Load more products</button></div>}
      <noscript><style>{`.${styles.productCard}[hidden]{display:block}`}</style><p>All products are listed. Open a category guide to browse by market.</p></noscript>
    </section>
  </>;
}
