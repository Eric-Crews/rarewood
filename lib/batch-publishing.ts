import {db,listProducts,listPosts} from './db';
import {generateEnhanced} from './enhanced-generation';
import {generateContent} from './generation';
import {ensureInsightDrafts,ensureTaxonomyDrafts} from './content-drafts';
import {generateProductTopics} from './topic-generation';
import {batchProductAllowed,productNeedsGeneration,topicArticle,isTaxonomyPage,taxonomyNeedsGeneration} from './batch-queue';
import {belongsToHub,categoryPeers,primaryProduct} from './content-graph';
import {isStartingProduct} from './catalog-availability';
import {recordSchema,blogTopicsSchema} from './validation';
import type {Product,Content} from './types';

// Called only behind the admin and same-origin checks in the admin action route.
// Standing publisher approval is not represented as a completed human review.
const approvedPublication=(content:Content):Content=>({...content,publicationMode:'preapproved-batch',publishedAt:new Date().toISOString()});
type Snapshot={content:string;updated_at:string};
async function productSnapshot(item:Product){
 const snapshot=await db().prepare('SELECT content,updated_at FROM products WHERE id=?').bind(item.id).first<Snapshot>();
 if(!snapshot||snapshot.updated_at!==item.updatedAt)throw new Error('This product changed. Refresh and retry; newer edits were preserved.');
 return snapshot;
}
const hubs=(posts:Awaited<ReturnType<typeof listPosts>>)=>posts.filter(post=>['tag','topic','category'].includes(post.content.pageType||'')).map(post=>({slug:post.slug,title:post.title}));

export async function publishBatchProduct(id:string){
 const products=await listProducts(true),item=products.find(row=>row.id===id);
 if(!item)throw new Error('Product not found.');
 if(!batchProductAllowed(item)||item.status!=='draft')return {id,skipped:true};
 const snapshot=await productSnapshot(item);
 const generated=productNeedsGeneration(item)?await generateEnhanced({kind:'product',name:item.name,slug:item.slug,category:item.category,summary:item.summary,sourceNotes:'',related:categoryPeers({...item,status:'published'},products.filter(batchProductAllowed)).map(row=>({slug:row.slug,name:row.name})),existingTopics:(await listPosts(true)).filter(post=>primaryProduct(post)===item.slug).map(post=>post.title),availableHubs:hubs(await listPosts(true)),existingMetadata:{tags:item.content.tags,topics:item.content.topics,aliases:item.content.aliases,hubSlugs:item.content.hubSlugs,parentHub:item.content.parentHub}}):null;
 // Existing enhanced/manual drafts are published as saved, never regenerated.
 const {slug:_ignored,category,summary,...generatedContent}=generated||{slug:item.slug,category:item.category,summary:item.summary};
 const content=approvedPublication(generated?{...item.content,...generatedContent,customLayout:true,sourceNotes:'',sourceNotesResetVersion:1}:item.content);
 const record=recordSchema.parse({...item,kind:'product',category,summary,content,status:'published'});
 const result=await db().prepare("UPDATE products SET category=?,summary=?,content=?,status='published',updated_at=? WHERE id=? AND status='draft' AND updated_at=? AND content=?").bind(record.category,record.summary,JSON.stringify({...content,...record.content}),new Date().toISOString(),id,snapshot.updated_at,snapshot.content).run();
 if(!result.meta.changes)throw new Error('This product changed during generation. Its newer edits were preserved.');
 await ensureInsightDrafts((await listProducts(true)).filter(row=>row.id===id));
 return {id,published:true,generated:!!generated};
}

export async function planBatchTopics(id:string){
 const item=(await listProducts(true)).find(row=>row.id===id);
 if(!item)throw new Error('Product not found.');
 if(!batchProductAllowed(item)||item.status!=='published')return {id,skipped:true};
 if(item.content.blogTopics?.length){blogTopicsSchema.parse(item.content.blogTopics);await ensureInsightDrafts([item]);return {id,topics:item.content.blogTopics,skipped:true};}
 const snapshot=await productSnapshot(item);
 const topics=await generateProductTopics(item,(await listPosts(true)).filter(post=>primaryProduct(post)===item.slug).map(post=>post.title));
 const result=await db().prepare("UPDATE products SET content=?,updated_at=? WHERE id=? AND status='published' AND updated_at=? AND content=?").bind(JSON.stringify({...JSON.parse(snapshot.content),blogTopics:topics}),new Date().toISOString(),id,snapshot.updated_at,snapshot.content).run();
 if(!result.meta.changes)throw new Error('The product changed while topics were planned. Newer edits were preserved.');
 await ensureInsightDrafts((await listProducts(true)).filter(row=>row.id===id));
 return {id,topics};
}

export async function publishBatchInsight(productId:string,topicSlug:string,publish=true){
 const products=await listProducts(true),parent=products.find(row=>row.id===productId);
 if(!parent||!batchProductAllowed(parent)||(publish&&parent.status!=='published'))throw new Error('Publish the eligible product before its supporting Insights.');
 const topic=parent.content.blogTopics?.find(row=>row.slug===topicSlug);
 if(!topic)throw new Error('The saved topic plan no longer contains this topic.');
 await ensureInsightDrafts([parent]);
 const posts=await listPosts(true),existing=topicArticle(parent,topic,posts);
 if(!existing)throw new Error('The product changed while the Insight was prepared. Refresh and retry.');
 if(existing.status==='published')return {id:existing.id,skipped:true};
 const snapshot=await db().prepare('SELECT content,updated_at FROM posts WHERE id=?').bind(existing.id).first<Snapshot>();
 if(!snapshot||snapshot.updated_at!==existing.updatedAt)throw new Error('This Insight changed. Refresh and retry.');
 const needsGeneration=existing.content.generationState==='planned';
 if(!needsGeneration&&!publish)return {id:existing.id,existing:true};
 const plan=existing.content.insightPlan||topic;
 const article=needsGeneration?await generateContent({kind:'post',name:existing.title,category:existing.category,summary:existing.summary,sourceNotes:`PRIMARY PRODUCT: ${parent.name}. Target keyword: ${plan.targetKeyword}. Intent: ${plan.intent}. Editorial brief: ${existing.content.sourceNotes||plan.brief}. Answer this specific question and lead readers back to the primary product page.`,related:[{slug:parent.slug,name:parent.name}],existingTopics:posts.filter(post=>post.id!==existing.id&&primaryProduct(post)===parent.slug).map(post=>post.title),availableHubs:hubs(posts),existingMetadata:{tags:existing.content.tags,topics:existing.content.topics,hubSlugs:existing.content.hubSlugs,parentHub:existing.content.parentHub}}):null;
 const {slug:_ignored,category,summary,...body}=article||{slug:existing.slug,category:existing.category,summary:existing.summary};
 const merge=(...lists:(string[]|undefined)[])=>Array.from(new Set(lists.flatMap(list=>list||[]))).slice(0,30);
 let content:Content={...existing.content,...body,generationState:'ready',primaryProduct:parent.slug,sourceTopicSlug:topic.slug,pageType:'article',relatedProducts:article?[parent.slug]:merge([parent.slug],existing.content.relatedProducts).slice(0,12),catalogPlacements:existing.content.catalogPlacements??parent.content.catalogPlacements,hubSlugs:merge(existing.content.hubSlugs,article?.hubSlugs,parent.content.hubSlugs),tags:merge(existing.content.tags,article?.tags),topics:merge(existing.content.topics,article?.topics)};
 if(article)content.customLayout=true;
 if(publish)content=approvedPublication(content);
 const record=recordSchema.parse({...existing,kind:'post',name:existing.title,category,summary,content,status:publish?'published':'draft'});
 const result=await db().prepare("UPDATE posts SET category=?,summary=?,content=?,status=?,updated_at=? WHERE id=? AND status='draft' AND updated_at=? AND content=? AND EXISTS (SELECT 1 FROM products WHERE id=? AND status=? AND updated_at=? AND slug=?)").bind(record.category,record.summary,JSON.stringify(content),record.status,new Date().toISOString(),existing.id,snapshot.updated_at,snapshot.content,parent.id,parent.status,parent.updatedAt,parent.slug).run();
 if(!result.meta.changes){const saved=await db().prepare('SELECT id,status FROM posts WHERE id=?').bind(existing.id).first<{id:string;status:string}>();if(saved?.status==='published')return {id:saved.id,skipped:true};throw new Error('The Insight or product changed during generation. Newer edits were preserved.');}
 await ensureTaxonomyDrafts([{...existing,category:record.category,summary:record.summary,content,status:record.status}],products);
 return {id:existing.id,published:publish,generated:!!article};
}

export async function publishBatchTaxonomy(id:string){
 const posts=await listPosts(true),existing=posts.find(post=>post.id===id);
 if(!existing||!isTaxonomyPage(existing))throw new Error('Choose an existing category, tag or topic page.');
 if(existing.status!=='draft')return {id,skipped:true};
 const snapshot=await db().prepare('SELECT content,updated_at FROM posts WHERE id=?').bind(id).first<Snapshot>();
 if(!snapshot||snapshot.updated_at!==existing.updatedAt)throw new Error('This collection changed. Refresh and retry.');
 let generated:Awaited<ReturnType<typeof generateContent>>|null=null;
 if(taxonomyNeedsGeneration(existing)){
  const products=await listProducts(true);
  const articleParents=new Set(posts.filter(post=>!isTaxonomyPage(post)&&belongsToHub(post,existing)).map(primaryProduct));
  // Draft members can inform a collection before their own pages are published.
  // The public collection renderer shows only published, eligible product links.
  const related=products.filter(item=>isStartingProduct(item)&&(belongsToHub(item,existing)||existing.content.relatedProducts.includes(item.slug)||articleParents.has(item.slug))).map(item=>({slug:item.slug,name:item.name}));
  const scope=existing.content.categoryScope;
  generated=await generateContent({kind:'hub',name:existing.title,slug:existing.slug,category:existing.category,summary:existing.summary,
   sourceNotes:[existing.content.sourceNotes,`Collection type: ${existing.content.pageType}.`,scope?`Collection scope: ${[scope.market,scope.category].filter(Boolean).join(' / ')}.`:''].filter(Boolean).join('\n'),
   related,availableHubs:hubs(posts).filter(hub=>hub.slug!==existing.slug),
   existingMetadata:{tags:existing.content.tags,topics:existing.content.topics,aliases:existing.content.aliases,hubSlugs:existing.content.hubSlugs,parentHub:existing.content.parentHub}});
 }
 const {slug:_ignored,category,summary,...body}=generated||{slug:existing.slug,category:existing.category,summary:existing.summary};
 const original=JSON.parse(snapshot.content) as Content;
 const merge=(...lists:(string[]|undefined)[])=>Array.from(new Set(lists.flatMap(list=>list||[]))).slice(0,30);
 const allowedHubs=new Set(hubs(posts).filter(hub=>hub.slug!==existing.slug).map(hub=>hub.slug));
 const content=approvedPublication(generated?{...original,...body,pageType:original.pageType,categoryScope:original.categoryScope,
  tags:merge(original.tags,generated.tags),topics:merge(original.topics,generated.topics),aliases:merge(original.aliases,generated.aliases),
  hubSlugs:merge(original.hubSlugs,generated.hubSlugs).filter(slug=>allowedHubs.has(slug)),
  parentHub:original.parentHub&&allowedHubs.has(original.parentHub)?original.parentHub:generated.parentHub,
  customLayout:true,generationState:'ready'}:original);
 const record=recordSchema.parse({...existing,kind:'post',name:existing.title,category,summary,content,status:'published'});
 const result=await db().prepare("UPDATE posts SET category=?,summary=?,content=?,status='published',updated_at=? WHERE id=? AND status='draft' AND updated_at=? AND content=?")
  .bind(record.category,record.summary,JSON.stringify(content),new Date().toISOString(),id,snapshot.updated_at,snapshot.content).run();
 if(!result.meta.changes){const saved=await db().prepare('SELECT status FROM posts WHERE id=?').bind(id).first<{status:string}>();if(saved?.status==='published')return {id,skipped:true};throw new Error('This collection changed during generation. Its newer edits were preserved.');}
 return {id,published:true,generated:!!generated};
}
