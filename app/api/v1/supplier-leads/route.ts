import {db,productBySlug} from '@/lib/db';
import {assertSameOrigin,jsonBody} from '@/lib/auth';
import {supplierLeadSchema} from '@/lib/supplier-leads';
import {canSellProduct} from '@/lib/supplier-content';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 try{assertSameOrigin(request);}catch{return reply({error:'Please submit the form from Rarewood Exchange.'},403);}
 let raw:unknown;try{raw=await jsonBody(request,12000);}catch{return reply({error:'Please check your form and try again.'},400);}
 const parsed=supplierLeadSchema.safeParse(raw);if(!parsed.success)return reply({error:parsed.error.issues[0]?.message||'Please check the required fields.'},400);
 const data=parsed.data;if(data.contactFax)return reply({error:'Unable to accept this submission.'},400);
 try{
  const previous=await db().prepare('SELECT reference FROM supplier_leads WHERE request_key=?').bind(data.requestKey).first<{reference:string}>();if(previous)return reply({reference:previous.reference});
  const item=await productBySlug(data.productSlug,true);if(!item||!canSellProduct(item))return reply({error:'This product is not accepting supplier submissions. Please choose a product from the sell directory.'},400);
  const ip=request.headers.get('cf-connecting-ip')||'';
  const ipHash=ip?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('supplier-rate-limit:'+ip)))).map(v=>v.toString(16).padStart(2,'0')).join(''):'';
  const since=new Date(Date.now()-3600000).toISOString();
  const recent=await db().prepare("SELECT (SELECT COUNT(*) FROM supplier_leads WHERE phone=? AND created_at>?) AS phone_count,(SELECT COUNT(*) FROM supplier_leads WHERE ip_hash=? AND ip_hash<>'' AND created_at>?) AS ip_count").bind(data.phone,since,ipHash,since).first<{phone_count:number;ip_count:number}>();
  if((recent?.phone_count||0)>=5||(recent?.ip_count||0)>=5)return reply({error:'Several submissions have been received recently. Please try again in an hour.'},429);
  const id=crypto.randomUUID(),reference='SUP-'+id.replaceAll('-','').slice(0,10).toUpperCase(),now=new Date().toISOString(),due=new Date(Date.parse(now)+7*86400000).toISOString();
  try{
   // Conditional insert keeps per-phone and per-IP limits atomic under concurrent requests.
   const saved=await db().prepare("INSERT INTO supplier_leads (id,request_key,reference,product_id,product_slug,product_name,quantity,unit,location,phone,name,company,email,availability,details,consent_at,ip_hash,status,broker,notes,created_at,updated_at,confirmed_at,review_due_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM supplier_leads WHERE phone=? AND created_at>?)<5 AND (?='' OR (SELECT COUNT(*) FROM supplier_leads WHERE ip_hash=? AND created_at>?)<5)").bind(id,data.requestKey,reference,item.id,item.slug,item.name,data.quantity,data.unit,data.location,data.phone,data.name,data.company,data.email.toLowerCase(),data.availability,data.details,now,ipHash,'new','','',now,now,now,due,data.phone,since,ipHash,ipHash,since).run();
   if(!saved.meta.changes){const duplicate=await db().prepare('SELECT reference FROM supplier_leads WHERE request_key=?').bind(data.requestKey).first<{reference:string}>();if(duplicate)return reply({reference:duplicate.reference});return reply({error:'Several submissions have been received recently. Please try again in an hour.'},429);}
  }catch(error){const retry=await db().prepare('SELECT reference FROM supplier_leads WHERE request_key=?').bind(data.requestKey).first<{reference:string}>();if(retry)return reply({reference:retry.reference});throw error;}
  return reply({reference},201);
 }catch(error){console.error('Supplier submission storage failed',error instanceof Error?error.message:'storage error');return reply({error:'Your inventory could not be saved. Your form details are preserved; please try again.'},503);}
}
