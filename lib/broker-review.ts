import {cookies} from 'next/headers';
import {isAdmin} from './auth';
import {db,ensureSeed} from './db';
import {isStartingProduct} from './catalog-availability';
import catalog from '../data/imported-catalog.json';
import type {Content} from './types';
import type {BrokerReviewItem,ReviewAnswer} from './broker-review-types';

export const REVIEW_COOKIE='__Host-rwx-broker-review';
const REVIEWER='Supply partner reviewer';
const imported=new Map(catalog.map(item=>[item.slug,item]));
export class ReviewError extends Error{constructor(message:string,public status=400){super(message);}}
export type ReviewActor={name:string;tokenHash:string|null};
export async function reviewTokenHash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),byte=>byte.toString(16).padStart(2,'0')).join('');}
export function reviewCookie(token:string,maxAge=30*86400){return `${REVIEW_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
export async function reviewAccessInfo(){
 const row=await db().prepare('SELECT reviewer,expires_at,revoked_at FROM broker_review_access WHERE id=?').bind('primary').first<{reviewer:string;expires_at:string;revoked_at:string|null}>();
 return {active:!!row&&!row.revoked_at&&row.expires_at>new Date().toISOString(),reviewer:row?.reviewer||REVIEWER,expiresAt:row?.expires_at||null};
}
export async function createReviewAccess(){
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
 const now=new Date().toISOString(),expiresAt=new Date(Date.now()+180*86400000).toISOString();
 await db().prepare('INSERT INTO broker_review_access (id,token_hash,reviewer,created_at,expires_at,revoked_at) VALUES (?,?,?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash,reviewer=excluded.reviewer,created_at=excluded.created_at,expires_at=excluded.expires_at,revoked_at=NULL').bind('primary',await reviewTokenHash(token),REVIEWER,now,expiresAt).run();
 return {token,active:true,reviewer:REVIEWER,expiresAt};
}
export async function actorForReviewToken(token:string|undefined):Promise<ReviewActor|null>{
 if(!token||! /^[a-f0-9]{64}$/.test(token))return null;
 const hash=await reviewTokenHash(token);
 const row=await db().prepare('SELECT reviewer FROM broker_review_access WHERE id=? AND token_hash=? AND revoked_at IS NULL AND expires_at>?').bind('primary',hash,new Date().toISOString()).first<{reviewer:string}>();
 return row?{name:row.reviewer,tokenHash:hash}:null;
}
export async function requireReviewActor():Promise<ReviewActor>{
 const actor=await actorForReviewToken((await cookies()).get(REVIEW_COOKIE)?.value);if(actor)return actor;
 if(await isAdmin())return {name:'Publisher · Rarewood Exchange',tokenHash:null};
 throw new ReviewError('Open the private review link provided by Rarewood Exchange to continue.',401);
}

type ReviewRow={id:string;name:string;slug:string;category:string;status:string;updated_at:string;details:string;answer:ReviewAnswer|null;reviewer:string|null;answered_at:string|null;revision:number|null;action_id:string|null};
const rowsSQL=`SELECT i.id,i.name,i.slug,i.category,i.status,i.updated_at,
 json_object('sourceStatus',json_extract(i.content,'$.sourceStatus'),'brokerAvailabilityConfirmed',json_extract(i.content,'$.brokerAvailabilityConfirmed'),'brokerAvailabilityNote',json_extract(i.content,'$.brokerAvailabilityNote'),'aliases',json_extract(i.content,'$.aliases'),'needsClarification',json_extract(i.content,'$.needsClarification')) AS details,
 r.answer,r.reviewer,r.answered_at,r.revision,r.action_id FROM products i LEFT JOIN broker_product_reviews r ON r.product_id=i.id`;
function reviewItem(row:ReviewRow):BrokerReviewItem{
 const raw=JSON.parse(row.details),source=imported.get(row.id.replace(/^catalog-/,''))||imported.get(row.slug);
 const content={...raw,sourceStatus:source?.sourceStatus||raw.sourceStatus,brokerAvailabilityConfirmed:raw.brokerAvailabilityConfirmed===1} as Content;
 const eligible=isStartingProduct({id:row.id,slug:row.slug,content});
 return {id:row.id,name:row.name,slug:row.slug,category:row.category,aliases:raw.aliases??source?.aliases??[],needsClarification:!!(raw.needsClarification??source?.needsClarification),catalogState:row.status==='published'&&eligible?'published':eligible?'draft':'future',updatedAt:row.updated_at,answer:row.answer,reviewer:row.reviewer,answeredAt:row.answered_at,revision:row.revision||0};
}
export async function brokerReviewItems(){
 await ensureSeed();
 const {results}=await db().prepare(`${rowsSQL} ORDER BY i.name COLLATE NOCASE`).all<ReviewRow>();
 return results.map(reviewItem).filter(item=>item.catalogState==='future'||item.answer!==null);
}
export async function saveBrokerReview(input:{id:string;answer:ReviewAnswer;updatedAt:string;revision:number;actionId:string},actor:ReviewActor){
 const row=await db().prepare(`${rowsSQL} WHERE i.id=?`).bind(input.id).first<ReviewRow>();
 if(!row)throw new ReviewError('This product no longer exists. Refresh the list.',404);
 const item=reviewItem(row);
 if(row.action_id===input.actionId)return item;
 if(item.catalogState!=='future'&&!item.answer)throw new ReviewError('This product is already approved outside this review. Refresh the list.',409);
 if(item.updatedAt!==input.updatedAt||item.revision!==input.revision)throw new ReviewError('This product changed in another session. Refresh before answering again.',409);
 const now=new Date().toISOString();
 const note=`${actor.name} answered ${input.answer==='yes'?'Yes — can source':'No — cannot source'} in the product review on ${now.slice(0,10)}.`;
 // Both writes are one transaction. The guarded answer claim prevents stale tabs,
 // revoked links and concurrent editorial changes from applying partial updates.
 const claim=db().prepare(`INSERT INTO broker_product_reviews (product_id,answer,reviewer,answered_at,revision,action_id)
 SELECT i.id,?,?,?,?,? FROM products i WHERE i.id=? AND i.updated_at=?
 AND COALESCE((SELECT revision FROM broker_product_reviews WHERE product_id=i.id),0)=?
 AND (? IS NULL OR EXISTS (SELECT 1 FROM broker_review_access WHERE id='primary' AND token_hash=? AND revoked_at IS NULL AND expires_at>?))
 ON CONFLICT(product_id) DO UPDATE SET answer=excluded.answer,reviewer=excluded.reviewer,answered_at=excluded.answered_at,revision=excluded.revision,action_id=excluded.action_id`)
 .bind(input.answer,actor.name,now,input.revision+1,input.actionId,input.id,input.updatedAt,input.revision,actor.tokenHash,actor.tokenHash,now);
 const update=db().prepare(`UPDATE products SET content=json_set(content,'$.brokerAvailabilityConfirmed',json(?),'$.brokerAvailabilityNote',?),status='draft',updated_at=?
 WHERE id=? AND updated_at=? AND status!='published' AND EXISTS (SELECT 1 FROM broker_product_reviews WHERE product_id=products.id AND action_id=?)`)
 .bind(input.answer==='yes'?'true':'false',note,now,input.id,input.updatedAt,input.actionId);
 const result=await db().batch([claim,update]);
 if(!result[0].meta.changes)throw new ReviewError('The product or review access changed. Refresh before continuing.',409);
 const saved=await db().prepare(`${rowsSQL} WHERE i.id=?`).bind(input.id).first<ReviewRow>();
 if(!saved)throw new ReviewError('The answer was saved, but the product is no longer available.',409);
 return reviewItem(saved);
}
