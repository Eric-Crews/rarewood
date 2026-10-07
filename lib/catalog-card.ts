import type {Product} from './types';

export type CatalogCard=Pick<Product,'id'|'slug'|'name'|'category'|'summary'|'status'|'image'>&{
 content:Pick<Product['content'],'aliases'|'catalogPlacements'>;
};
// Cards and filters do not need full article bodies, research, or editorial plans.
export function catalogCard(item:Product):CatalogCard{
 return {id:item.id,slug:item.slug,name:item.name,category:item.category,summary:item.summary,image:item.image,status:item.status,content:{aliases:item.content.aliases||[],catalogPlacements:item.content.catalogPlacements||[]}};
}
