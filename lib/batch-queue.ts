import {isStartingProduct} from './catalog-availability';
import type {Product,Post,BlogTopic} from './types';

export const batchProductAllowed=(item:Product)=>isStartingProduct(item)&&!item.content.needsClarification;
export const productNeedsGeneration=(item:Product)=>!item.content.generatedAt&&!item.content.landingProfile&&!item.content.customLayout;
export const pendingBatchProducts=(items:Product[])=>items.filter(item=>batchProductAllowed(item)&&item.status==='draft');
export const isTaxonomyPage=(post:Post)=>['tag','topic','category'].includes(post.content.pageType||'');
export const taxonomyNeedsGeneration=(post:Post)=>post.content.generationState==='planned'||(!post.content.generatedAt&&!post.content.customLayout&&post.content.generationState!=='ready');
export const pendingBatchTaxonomy=(posts:Post[])=>posts.filter(post=>post.status==='draft'&&isTaxonomyPage(post)).sort((a,b)=>a.title.localeCompare(b.title)||a.slug.localeCompare(b.slug));
export function topicArticle(parent:Pick<Product,'slug'>,topic:BlogTopic,posts:Post[]){
 return posts.find(post=>(!post.content.pageType||post.content.pageType==='article')&&post.content.primaryProduct===parent.slug&&(post.content.sourceTopicSlug===topic.slug||post.title.trim().toLowerCase()===topic.title.trim().toLowerCase()));
}
export function pendingBatchInsights(products:Product[],posts:Post[]){
 return products.filter(item=>batchProductAllowed(item)&&item.status==='published').flatMap(parent=>(parent.content.blogTopics||[]).filter(topic=>topicArticle(parent,topic,posts)?.status!=='published').map(topic=>({productId:parent.id,topicSlug:topic.slug,title:topic.title})));
}
