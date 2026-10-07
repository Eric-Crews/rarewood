import {Search, X,ArrowLeft,ArrowRight} from 'lucide-react';
import {journalHref,journalPageNumbers,type paginateJournal,type JournalQuery,type JournalEntry} from '@/lib/journal';
import styles from '@/app/insights/journal.module.css';

function JournalCard({entry,featured=false}:{entry:JournalEntry;featured?:boolean}){
  return <article className={featured?styles.featured:styles.card}>
    <a className={styles.cardLink} href={`/insights/${entry.slug}`}>
      <div className={styles.cardImage}>
        <img src={entry.image} srcSet={entry.imageSmall?`${entry.imageSmall} ${entry.image.includes('field-notes')?760:480}w, ${entry.image} ${entry.image.includes('field-notes')?1672:1100}w`:undefined} sizes={featured?'(max-width: 700px) 100vw, 42vw':'(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw'} width={1100} height={825} alt={entry.imageAlt} loading="lazy" decoding="async"/>
        {featured&&<span className={styles.imageCaption}>Quality specifications.<br/>Stronger supply chains.</span>}
      </div>
      <div className={styles.cardCopy}>
        {featured&&<span className={styles.featuredLabel}>Featured article</span>}
        <div className={styles.meta}><span>{entry.category}</span><span>{entry.minutes} min read</span></div>
        <h2>{entry.title}</h2>
        <p>{entry.summary}</p>
        <span className={styles.readLink}>Read the guide</span>
      </div>
    </a>
  </article>;
}
export function JournalBrowser({result,query,categories,totalEntries}:{result:ReturnType<typeof paginateJournal>;query:JournalQuery;categories:string[];totalEntries:number}){
  const {category,page}=query;
  const featured=page===1?result.entries[0]:undefined;
  const rest=result.entries.filter(entry=>entry.id!==featured?.id);
  const filtering=category!=='All'||!!query.query;
  const href=(target:Partial<JournalQuery>)=>journalHref({...query,...target})+'#journal-articles';
  return <section id="journal-articles" className={styles.browser} aria-label="Sourcing articles" tabIndex={-1}>
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Filter by guide type">
        {categories.map(label=><a key={label} aria-current={category===label?'true':undefined} href={href({category:label,page:1})}>{label}</a>)}
      </div>
      <form className={styles.search} role="search" action="/insights#journal-articles" method="get">
        {query.mix&&<input type="hidden" name="mix" value={query.mix}/>}
        {category!=='All'&&<input type="hidden" name="category" value={category}/>}
        <Search size={19} aria-hidden="true"/>
        <input type="search" name="q" defaultValue={query.query} maxLength={200} aria-label="Search articles, topics, or products" placeholder="Search articles, topics, or products…"/>
        {query.query&&<a className={styles.clearSearch} href={href({query:'',page:1})} aria-label="Clear search"><X size={17}/></a>}
        <button type="submit" className={styles.searchSubmit}>Search</button>
      </form>
    </div>
    <div className={styles.resultStatus} role="status">
      <span>{result.total?`Showing ${result.start}–${result.end} of ${result.total} ${result.total===1?'article':'articles'}`:'0 articles found'}{query.query?` matching “${query.query}”`:''}</span>
      {filtering&&<a href="/insights#journal-articles">Clear filters</a>}
    </div>
    {result.entries.length>0?<>
      {featured&&<JournalCard entry={featured} featured/>}
      {rest.length>0&&<div className={styles.grid}>{rest.map(entry=><JournalCard key={entry.id} entry={entry}/>)}</div>}
    </>:<div className={styles.empty}>
      <h2>{totalEntries?'No matching guides.':'New sourcing guides are on the way.'}</h2>
      <p>{totalEntries?'Try a product name or a broader topic.':'Explore the product directory to get started with your buying requirements.'}</p>
      {totalEntries?<a className={styles.quoteButton} href="/insights#journal-articles">View all guides</a>:<a className={styles.quoteButton} href="/products">Explore products</a>}
    </div>}
    {result.pageCount>1&&<nav className={styles.pagination} aria-label="Insights pagination">
      {page>1?<a className={styles.previousPage} href={href({page:page-1})} rel="prev"><ArrowLeft size={17} aria-hidden="true"/>Previous</a>:<span className={styles.previousPage} aria-disabled="true"><ArrowLeft size={17} aria-hidden="true"/>Previous</span>}
      <div className={styles.pageNumbers}>{journalPageNumbers(page,result.pageCount).map((number,index)=>number==='ellipsis'?<span className={styles.ellipsis} key={`gap-${index}`} aria-hidden="true">…</span>:<a key={number} href={href({page:number})} aria-label={`Page ${number}`} aria-current={page===number?'page':undefined}>{number}</a>)}</div>
      {page<result.pageCount?<a className={styles.nextPage} href={href({page:page+1})} rel="next">Next<ArrowRight size={17} aria-hidden="true"/></a>:<span className={styles.nextPage} aria-disabled="true">Next<ArrowRight size={17} aria-hidden="true"/></span>}
      <p>Page {page} of {result.pageCount}</p>
    </nav>}
  </section>;
}
