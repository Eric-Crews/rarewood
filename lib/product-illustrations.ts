import source from '@/data/illustrations/runtime.json';

export type IllustrationLevel='specific'|'category'|'generic';
export type IllustrationAsset={imageId:string;src:string;srcSet:string;alt:string;width:number;height:number;level:IllustrationLevel};
type Assignment={image_id:string;level:IllustrationLevel};
type Family={alt:string;status:string;width:number;height:number};
type IllustrationCatalog={asset_base:string;generic_image_id:string;families:Record<string,Family>;categories:Record<string,string>;record_assignments:Record<string,Assignment>;slug_assignments:Record<string,Assignment>};
const catalog=source as IllustrationCatalog;
export type IllustrationProduct={id?:string;slug:string;category:string;placements?:{category:string}[];content?:{catalogPlacements?:{category:string}[]}};
const normalizedCategory=(value:string)=>value.toLowerCase().replace(/\s*[&/]\s*/g,'/').replace(/\s+/g,' ').trim();
const categoryIds=new Map(Object.entries(catalog.categories).map(([name,id])=>[normalizedCategory(name),id]));

export function illustrationAssignment(item:Pick<IllustrationProduct,'id'|'slug'>):Assignment|undefined{
  return (item.id?catalog.record_assignments[item.id]:undefined)||catalog.slug_assignments[item.slug];
}
function asset(imageId:string|undefined,level:IllustrationLevel):IllustrationAsset|undefined{
  const family=imageId?catalog.families[imageId]:undefined;
  if(!imageId||!family||family.status!=='ready')return undefined;
  const path=`${catalog.asset_base}/${imageId}`;
  return {imageId,level,src:`${path}.webp`,srcSet:`${path}-small.webp 240w, ${path}.webp 640w`,alt:family.alt,width:family.width,height:family.height};
}
function uniqueAssets(entries:(IllustrationAsset|undefined)[]){
  const seen=new Set<string>();
  return entries.filter((entry):entry is IllustrationAsset=>{if(!entry||seen.has(entry.imageId))return false;seen.add(entry.imageId);return true;});
}
export function categoryIllustrations(category:string):IllustrationAsset[]{
  return uniqueAssets([asset(categoryIds.get(normalizedCategory(category)),'category'),asset(catalog.generic_image_id,'generic')]);
}
export function productIllustrations(item:IllustrationProduct,preferredCategory?:string):IllustrationAsset[]{
  const assignment=illustrationAssignment(item);
  const categories=[preferredCategory,...(item.placements||item.content?.catalogPlacements||[]).map(p=>p.category),item.category].filter((value):value is string=>!!value);
  const categoryId=categories.map(category=>categoryIds.get(normalizedCategory(category))).find(Boolean);
  // Neutral assignments deliberately avoid a category that would imply an unconfirmed source.
  if(assignment?.level==='generic')return uniqueAssets([asset(assignment.image_id,'generic'),asset(catalog.generic_image_id,'generic')]);
  return uniqueAssets([asset(assignment?.image_id,assignment?.level||'specific'),asset(categoryId,'category'),asset(catalog.generic_image_id,'generic')]);
}
