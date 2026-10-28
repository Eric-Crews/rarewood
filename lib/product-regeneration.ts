import {db,listProducts} from './db';
import {batchProductAllowed} from './batch-queue';
import type {Product} from './types';

type StoredProduct={id:string;content:string;updated_at:string};
type ResetItem={id:string;name:string;updatedAt:string};

async function resetSelected(items:Product[]):Promise<ResetItem[]>{
 if(!items.length)return [];
 const {results}=await db().prepare("SELECT id,content,updated_at FROM products WHERE status='published'").all() as {results:StoredProduct[]};
 const stored=new Map(results.map(row=>[row.id,row]));
 const updates=items.flatMap(item=>{
  const row=stored.get(item.id);if(!row||row.updated_at!==item.updatedAt)return [];
  const content=JSON.parse(row.content) as Product['content'];
  content.generationState='planned';
  return [{item,row,content:JSON.stringify(content)}];
 });
 const changed:ResetItem[]=[];
 for(let start=0;start<updates.length;start+=40){
  const batch=updates.slice(start,start+40),updatedAt=new Date().toISOString();
  const results=await db().batch(batch.map(({item,row,content})=>db().prepare("UPDATE products SET status='draft',content=?,updated_at=? WHERE id=? AND status='published' AND updated_at=? AND content=?").bind(content,updatedAt,item.id,row.updated_at,row.content)));
  results.forEach((result,index)=>{if(result.meta.changes)changed.push({id:batch[index].item.id,name:batch[index].item.name,updatedAt});});
 }
 return changed;
}

/** Moves the published, approved catalog into the existing sequential OpenAI publish queue. */
export async function resetAllPublishedProductsForRegeneration(){
 const products=(await listProducts(true)).filter(item=>item.status==='published'&&batchProductAllowed(item));
 const items=await resetSelected(products);
 return {reset:items.length,items};
}

/** Testable single-record variant used to verify draft staging and conflict guards. */
export async function resetPublishedProductForRegeneration(id:string){
 const item=(await listProducts(true)).find(product=>product.id===id);
 if(!item)throw new Error('Product not found.');
 if(item.status!=='published'||!batchProductAllowed(item))return {id,skipped:true};
 const [reset]=await resetSelected([item]);
 if(!reset)throw new Error('This product changed before it could be moved to drafts. Refresh and retry.');
 return reset;
}
