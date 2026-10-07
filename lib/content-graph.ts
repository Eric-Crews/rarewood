import type {Content,Product,Post} from './types';
export type CategoryScope={market:string;category?:string};
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const categorySlug=(scope:CategoryScope)=>scope.category?`category-${slug([scope.market,scope.category].filter(Boolean).join('-'))}`:`market-${slug(scope.market)}`;
export const productScopes=(i:Pick<Product,'category'|'content'>):CategoryScope[]=>i.content.catalogPlacements?.length?i.content.catalogPlacements:[{market:'',category:i.category}];
export function inCategory(i:Pick<Product,'category'|'content'>,scope:CategoryScope){return productScopes(i).some(p=>(!scope.market||p.market===scope.market)&&(!scope.category||p.category===scope.category));}
export function sameCategory(a:Product,b:Product){return productScopes(a).some(s=>productScopes(b).some(p=>p.market===s.market&&p.category===s.category));}
export function categoryPeers(item:Product,all:Product[],limit=4){return all.filter(i=>i.slug!==item.slug&&sameCategory(item,i)&&(item.status==='draft'||i.status==='published')).sort((a,b)=>Number(b.status==='published')-Number(a.status==='published')||Number(!!b.image)-Number(!!a.image)||a.name.localeCompare(b.name)).slice(0,limit);}
export const primaryProduct=(p:Post)=>p.content.primaryProduct||p.content.relatedProducts[0];
export function belongsToHub(p:{category:string;content:Content},hub:Post){if(p.content.hubSlugs?.includes(hub.slug)||p.content.parentHub===hub.slug)return true;if(hub.content.categoryScope)return inCategory(p,hub.content.categoryScope);const normalized=(s:string)=>slug(s.trim());return hub.content.pageType==='tag'?p.content.tags?.some(t=>normalized(t)===normalized(hub.title)):hub.content.pageType==='topic'?p.content.topics?.some(t=>normalized(t)===normalized(hub.title)):hub.content.pageType==='category'&&p.category===hub.title;}
