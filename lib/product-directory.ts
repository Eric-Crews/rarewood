import type {Product,CatalogPlacement} from './types';
export type DirectoryProduct={id:string;slug:string;name:string;category:string;summary:string;image:string;imageAlt:string;status:string;aliases:string[];placements:CatalogPlacement[]};
export type DirectoryHub={slug:string;market:string;category:string};
export type DirectorySort='name-asc'|'name-desc'|'category';
export const featuredCategories=['Exotic lumber','Hardwood decking','Slabs & rounds','Hardwood flooring','Plywood & panels'];
export const categoryLabel=(category:string)=>category.replaceAll('/', ' / ');
// The browser needs card fields, not stored research, source notes, or draft bodies.
export function directoryProduct(item:Product):DirectoryProduct{
  return {id:item.id,slug:item.slug,name:item.name,category:item.category,summary:item.summary,image:item.image,imageAlt:item.content.imageAlt||item.name,status:item.status,aliases:item.content.aliases||[],placements:item.content.catalogPlacements?.length?item.content.catalogPlacements:[{market:'',category:item.category}]};
}
export function directoryCategories(items:DirectoryProduct[],market='All markets'){
  const counts=new Map<string,number>();
  for(const item of items){const names=new Set(item.placements.filter(p=>market==='All markets'||p.market===market).map(p=>p.category));for(const name of names)counts.set(name,(counts.get(name)||0)+1);}
  return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>a.name.localeCompare(b.name));
}
export function filterDirectory(items:DirectoryProduct[],market:string,category:string,query:string,sort:DirectorySort){
  const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item=>{
    const placement=item.placements.some(p=>(market==='All markets'||p.market===market)&&(category==='All categories'||p.category===category));
    const text=[item.name,item.category,item.summary,...item.aliases,...item.placements.flatMap(p=>[p.market,p.category])].join(' ').toLowerCase();
    return placement&&terms.every(term=>text.includes(term));
  }).sort((a,b)=>sort==='name-desc'?b.name.localeCompare(a.name):sort==='category'?a.placements[0].category.localeCompare(b.placements[0].category)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
}
