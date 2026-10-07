import {db,listProducts,listPosts} from './db';
import {batchProductAllowed,topicArticle} from './batch-queue';
import {categorySlug,productScopes,primaryProduct} from './content-graph';
import {blogTopicsSchema,slugify} from './validation';
import type {Content,Product,Post,BlogTopic} from './types';

const normalize=(value:string)=>slugify(value.trim());
export async function insightIdentity(parent:Product,topic:BlogTopic){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${parent.id}:${topic.slug}`));
 const id='spoke-'+Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('');
 return {id,slug:slugify(`${parent.slug}-${topic.slug}`).slice(0,100).replace(/-$/,'')+'-'+id.slice(-8)};
}
const plannedContent=(title:string,brief:string):Content=>({generationState:'planned',seoTitle:title.slice(0,100),seoDescription:brief.slice(0,200),sections:[{heading:'Editorial brief',paragraphs:[brief]}],applications:[],buyingChecklist:[],faqs:[],relatedProducts:[],sourceNotes:brief});
async function execute(statements:D1PreparedStatement[]){let count=0;for(let start=0;start<statements.length;start+=40){const results=await db().batch(statements.slice(start,start+40));count+=results.reduce((sum,result)=>sum+(result.meta.changes||0),0);}return count;}

// Insert only: saved work (including edited briefs and published articles) is never replaced.
// Used after product saves and to reconcile older saved plans when the admin opens.
export async function ensureInsightDrafts(products?:Product[],posts?:Post[]){
 const parents=products||await listProducts(true),known=posts||await listPosts(true),statements:D1PreparedStatement[]=[];
 for(const parent of parents.filter(batchProductAllowed)){
  const parsed=blogTopicsSchema.safeParse(parent.content.blogTopics);if(!parsed.success)continue;
  for(const topic of parsed.data){
   if(topicArticle(parent,topic,known))continue;
   const {id,slug}=await insightIdentity(parent,topic),now=new Date().toISOString();
   const content:Content={...plannedContent(topic.title,topic.brief),insightPlan:topic,primaryProduct:parent.slug,sourceTopicSlug:topic.slug,pageType:'article',relatedProducts:[parent.slug],tags:parent.content.tags||[],topics:parent.content.topics||[],hubSlugs:parent.content.hubSlugs||[],parentHub:parent.content.parentHub,catalogPlacements:parent.content.catalogPlacements};
   statements.push(db().prepare("INSERT INTO posts (id,slug,title,category,summary,content,image,image_credit,status,created_at,updated_at) SELECT ?,?,?,?,?,?,'','','draft',?,? WHERE EXISTS (SELECT 1 FROM products WHERE id=? AND slug=? AND updated_at=?) AND NOT EXISTS (SELECT 1 FROM posts WHERE json_extract(content,'$.primaryProduct')=? AND (json_extract(content,'$.sourceTopicSlug')=? OR lower(trim(title))=lower(trim(?)))) ON CONFLICT DO NOTHING").bind(id,slug,topic.title,'Buyer’s guide',topic.brief.slice(0,500),JSON.stringify(content),now,now,parent.id,parent.slug,parent.updatedAt,parent.slug,topic.slug,topic.title));
  }
 }
 return {created:await execute(statements)};
}

// Taxonomy is shared by normalized name. Existing landing pages retain their copy/status.
export async function ensureTaxonomyDrafts(records:Post[],products?:Product[],posts?:Post[]){
 const parents=products||await listProducts(true),known=posts||await listPosts(true),statements:D1PreparedStatement[]=[];
 const seen=new Set<string>();
 for(const post of records){
  if((post.content.pageType&&post.content.pageType!=='article')||post.content.generationState==='planned')continue;
  const parent=parents.find(item=>item.slug===primaryProduct(post));if(!parent||!batchProductAllowed(parent))continue;
  const candidates=[...(post.content.tags||[]).map(title=>({type:'tag' as const,title,scope:undefined as Content['categoryScope']})),...(post.content.topics||[]).map(title=>({type:'topic' as const,title,scope:undefined as Content['categoryScope']})),...productScopes(parent).map(scope=>({type:'category' as const,title:scope.category||scope.market,scope}))];
  for(const candidate of candidates){
   const {type,title,scope}=candidate,key=scope?categorySlug(scope):`${type}-${normalize(title)}`;
   if(!normalize(title)||seen.has(key)||known.some(hub=>hub.content.pageType===type&&(scope?hub.slug===key||(hub.content.categoryScope?.market===scope.market&&hub.content.categoryScope?.category===scope.category):normalize(hub.title)===normalize(title))))continue;
   seen.add(key);
   const brief=`Create a concise ${type} overview for ${title}, explaining the related bulk products, buying considerations and useful buyer FAQs.`,now=new Date().toISOString();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(value=>value.toString(16).padStart(2,'0')).join('');
   const content={...plannedContent(`${title} | Rarewood Exchange`,brief),pageType:type,categoryScope:scope,relatedProducts:[parent.slug],tags:type==='tag'?[title]:[],topics:type==='topic'?[title]:[]};
   statements.push(db().prepare("INSERT INTO posts (id,slug,title,category,summary,content,image,image_credit,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'','','draft',?,?) ON CONFLICT DO NOTHING").bind(`taxonomy-${hash}`,key.slice(0,120).replace(/-+$/,''),title,type==='category'?'Category':type==='tag'?'Tag':'Topic',brief.slice(0,500),JSON.stringify(content),now,now));
  }
 }
 return {created:await execute(statements)};
}

export async function syncContentDrafts(){
 const products=await listProducts(true),posts=await listPosts(true);
 const insights=await ensureInsightDrafts(products,posts);
 const taxonomy=await ensureTaxonomyDrafts(posts,products,posts);
 return {insightsCreated:insights.created,taxonomyCreated:taxonomy.created};
}
