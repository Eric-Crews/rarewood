import {belongsToHub,primaryProduct} from './content-graph';
import {categoryIllustrations,type IllustrationAsset} from './product-illustrations';
import {publicContent} from './public-content';
import type {Product,Post} from './types';

export type DirectoryCollection={
  slug:string;title:string;summary:string;kind:'category'|'topic'|'tag';market:string;
  isMarket:boolean;image:string;imageCredit:string;illustrations:IllustrationAsset[];
  productCount:number;insightCount:number;
};

/** Public card data only; never send saved briefs or research to the browser. */
export function collectionDirectory(hubs:Post[],products:Product[],posts:Post[]):DirectoryCollection[]{
  const publishedProducts=products.filter(i=>i.status==='published');
  const eligibleParents=new Set(publishedProducts.map(i=>i.slug));
  const articles=posts.filter(p=>p.status==='published'&&(!p.content.pageType||p.content.pageType==='article')&&p.content.generationState!=='planned'&&(!primaryProduct(p)||eligibleParents.has(primaryProduct(p))));
  return hubs.filter(h=>h.status==='published'&&h.content.generationState!=='planned'&&['category','topic','tag'].includes(h.content.pageType||'')).map(h=>{
    const content=publicContent(h.content),scope=content.categoryScope;
    const articleParents=new Set(articles.filter(p=>belongsToHub(p,h)).map(primaryProduct));
    const members=publishedProducts.filter(i=>belongsToHub(i,h)||content.relatedProducts.includes(i.slug)||articleParents.has(i.slug));
    const memberSlugs=new Set(members.map(i=>i.slug));
    return {slug:h.slug,title:h.title,summary:h.summary,kind:content.pageType as DirectoryCollection['kind'],market:scope?.market||'',isMarket:content.pageType==='category'&&!!scope?.market&&!scope.category,image:h.image,imageCredit:h.imageCredit,
      illustrations:categoryIllustrations(scope?.category||scope?.market||h.title),productCount:members.length,
      insightCount:articles.filter(p=>belongsToHub(p,h)||memberSlugs.has(primaryProduct(p))).length};
  }).sort((a,b)=>a.title.localeCompare(b.title)||a.market.localeCompare(b.market));
}

export function filterCollections(items:DirectoryCollection[],query:string,kind:string,market:string){
  const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item=>(kind==='all'||item.kind===kind)&&(!market||item.market===market)&&terms.every(term=>`${item.title} ${item.market} ${item.summary}`.toLocaleLowerCase().includes(term)));
}
