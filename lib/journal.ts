import type {Post} from './types';

export type JournalEntry={
  id:string;slug:string;title:string;summary:string;category:string;minutes:number;
  image:string;imageSmall?:string;imageAlt:string;searchText:string;
};
const coverFor=(_post:Post)=>({name:'workshop',alt:'Illustrative hardwood workshop scene'});
const labels:Record<string,string>={
  'buyers guide':'Buyer’s guide','buyer guide':'Buyer’s guide',
  'sourcing guide':'Sourcing guide','product brief':'Product brief',
  'buyers note':'Buyer’s note','buyer note':'Buyer’s note',
};
// Send only public card fields to the browser, never the stored research or notes.
export function journalEntry(post:Post):JournalEntry{
  const cover=coverFor(post);
  const customImage=post.image&&post.image!=='/images/wood/workshop.webp';
  const labelKey=post.category.toLowerCase().replace(/[’']/g,'').trim();
  const category=labels[labelKey]||post.category||'Sourcing guide';
  const words=[post.summary,...post.content.sections.flatMap(s=>[s.heading,...s.paragraphs]),...post.content.buyingChecklist,...post.content.faqs.flatMap(f=>[f.question,f.answer])].join(' ').trim().split(/\s+/).length;
  return {
    id:post.id,slug:post.slug,title:post.title,summary:post.summary,category,
    minutes:Math.max(1,Math.ceil(words/200)),
    image:customImage?post.image:'/images/wood/workshop.webp',
    imageSmall:customImage?undefined:'/images/wood/workshop-small.webp',
    imageAlt:customImage?(post.content.imageAlt||`Illustration for ${post.title}`):cover.alt,
    searchText:[post.title,post.summary,category,post.content.primaryProduct,...post.content.relatedProducts,...(post.content.tags||[]),...(post.content.topics||[])].filter(Boolean).join(' ').replace(/-/g,' '),
  };
}
export function filterJournal(entries:JournalEntry[],category:string,query:string){
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry=>(category==='All'||entry.category===category)&&terms.every(term=>entry.searchText.toLocaleLowerCase().includes(term)));
}
export function featuredEntry(entries:JournalEntry[]){
  return entries.find(entry=>/ipe-decking/i.test(entry.title)&&/specification/i.test(entry.title))||entries[0];
}

export const JOURNAL_PAGE_SIZE=12;
export type JournalQuery={page:number;category:string;query:string;mix?:string};
export type JournalSearchParams=Record<string,string|string[]|undefined>;
export function parseJournalQuery(params:JournalSearchParams):JournalQuery{
  const value=(key:string)=>{const raw=params[key];return (Array.isArray(raw)?raw[0]:raw)||'';};
  const page=Number(value('page'));
  const mix=value('mix');
  return {page:Number.isSafeInteger(page)&&page>0?page:1,category:value('category').trim().slice(0,80)||'All',query:value('q').trim().slice(0,200),...(/^[a-f0-9]{16}$/.test(mix)?{mix}:{})};
}
export function journalHref({page=1,category='All',query='',mix}:Partial<JournalQuery>={}){
  const params=new URLSearchParams();
  if(category!=='All')params.set('category',category);
  if(query)params.set('q',query);
  if(page>1)params.set('page',String(page));
  if(mix)params.set('mix',mix);
  return '/insights'+(params.size?'?'+params.toString():'');
}
// Rank by stable IDs rather than timestamps. A browse seed travels with links so
// pagination and filters keep the same mix; a fresh /insights visit gets a new one.
function journalRank(id:string,mix:string){
  let hash=2166136261;
  for(const character of `${mix}:${id}`)hash=Math.imul(hash^character.charCodeAt(0),16777619);
  hash=Math.imul(hash^(hash>>>16),0x85ebca6b);
  hash=Math.imul(hash^(hash>>>13),0xc2b2ae35);
  return (hash^(hash>>>16))>>>0;
}
// Homepage cards rotate across products before using a second article from one.
export function selectHomepagePosts(posts:Post[],mix:string){
  const shuffled=posts.filter(post=>post.status==='published'&&post.content.generationState!=='planned'&&(!post.content.pageType||post.content.pageType==='article'))
    .map(post=>({post,rank:journalRank(post.id,mix)}))
    .sort((a,b)=>a.rank-b.rank||a.post.id.localeCompare(b.post.id)).map(({post})=>post);
  const seen=new Set<string>(),varied:Post[]=[],remaining:Post[]=[];
  for(const post of shuffled){
    const product=post.content.primaryProduct||post.content.relatedProducts[0];
    const key=product?`product:${product}`:`post:${post.id}`;
    if(seen.has(key))remaining.push(post);
    else {seen.add(key);varied.push(post);}
  }
  return [...varied,...remaining].slice(0,3);
}
export function paginateJournal(entries:JournalEntry[],query:JournalQuery){
  const filtered=filterJournal(entries,query.category,query.query);
  const featured=featuredEntry(filtered);
  // Keep the editorial lead, shuffle the complete remaining set, then paginate.
  const rest=filtered.filter(entry=>entry.id!==featured?.id).map(entry=>({entry,rank:journalRank(entry.id,query.mix||'default')}))
    .sort((a,b)=>a.rank-b.rank||a.entry.id.localeCompare(b.entry.id)).map(({entry})=>entry);
  const ordered=featured?[featured,...rest]:[];
  const total=ordered.length,pageCount=Math.max(1,Math.ceil(total/JOURNAL_PAGE_SIZE));
  const offset=(query.page-1)*JOURNAL_PAGE_SIZE;
  return {entries:ordered.slice(offset,offset+JOURNAL_PAGE_SIZE),total,pageCount,page:query.page,start:total?offset+1:0,end:Math.min(offset+JOURNAL_PAGE_SIZE,total),outOfRange:query.page>pageCount};
}
export function journalPageNumbers(page:number,total:number):(number|'ellipsis')[]{
  const pages=Array.from(new Set([1,total,page-1,page,page+1])).filter(n=>n>=1&&n<=total).sort((a,b)=>a-b);
  const result:(number|'ellipsis')[]=[];
  for(const [index,value] of pages.entries()){
    if(index&&value-pages[index-1]>1)result.push('ellipsis');
    result.push(value);
  }
  return result;
}
export function journalMetadata(query:JournalQuery){
  // Random display variants share the ordinary page canonical.
  return {title:query.page>1?`The Sourcing Journal — Page ${query.page}`:'The Sourcing Journal',description:'Practical buying guides for specialty wood, commercial specifications, and better sourcing conversations.',alternates:{canonical:journalHref({...query,mix:undefined})},...(query.query||query.category!=='All'?{robots:{index:false,follow:true}}:{})};
}
