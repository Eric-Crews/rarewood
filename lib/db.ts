import {seedWoodDatabase} from './wood-db';
import {isStartingProduct} from './catalog-availability';
import { env } from 'cloudflare:workers';
import {categorySeeds} from './category-seeds';
import { seedProducts, seedPosts } from './seed';
import importedCatalog from '../data/imported-catalog.json';
import type { Product,Post,Lead } from './types';
export function runtime(){return env as unknown as {DB:D1Database;BUCKET:R2Bucket;OPENAI_API_KEY?:string;PEXELS_API_KEY?:string;OPENAI_MODEL?:string;SITE_URL?:string;ADMIN_EMAILS?:string;ADMIN_PASSWORD?:string;ADMIN_SESSION_SECRET?:string};}
export function db(){const d=runtime().DB;if(!d)throw new Error('The database is unavailable. Please try again.');return d;}
export function origin(){return (runtime().SITE_URL || 'https://rarewood-exchange.advguides.chatgpt.site').replace(/\/$/,'');}
let seedPromise:Promise<void>|undefined;
const catalogBySlug=new Map(importedCatalog.map(r=>[r.slug,r]));
export async function ensureSeed(){if(!seedPromise)seedPromise=(async()=>{const statements=[...seedProducts.map(r=>db().prepare('INSERT OR IGNORE INTO products (id,slug,name,category,summary,content,image,image_credit,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(r.id,r.slug,r.name,r.category,r.summary,JSON.stringify(r.content),r.image,r.imageCredit,r.status,r.createdAt,r.updatedAt)),...[...seedPosts,...categorySeeds].map(r=>db().prepare('INSERT OR IGNORE INTO posts (id,slug,title,category,summary,content,image,image_credit,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(r.id,r.slug,r.title,r.category,r.summary,JSON.stringify(r.content),r.image,r.imageCredit,r.status,r.createdAt,r.updatedAt))];for(let n=0;n<statements.length;n+=40)await db().batch(statements.slice(n,n+40));await seedWoodDatabase();})();try{await seedPromise;}catch(e){seedPromise=undefined;throw e;}}
function decode(r:Record<string,unknown>){const content=JSON.parse(r.content as string);const catalog=catalogBySlug.get(String(r.slug));if(catalog){content.aliases??=catalog.aliases;content.catalogPlacements??=catalog.placements;content.sourceStatus??=catalog.sourceStatus;content.needsClarification??=catalog.needsClarification;}return {...r,content,imageCredit:r.image_credit,createdAt:r.created_at,updatedAt:r.updated_at};}
export async function listProducts(all=false){await ensureSeed();const {results}=await db().prepare(`SELECT * FROM products ${all?'':"WHERE status='published'"} ORDER BY name`).all();return (results.map(decode) as Product[]).filter(i=>all||isStartingProduct(i));}
export async function productBySlug(slug:string,all=false){await ensureSeed();const r=await db().prepare(`SELECT * FROM products WHERE slug=? ${all?'':"AND status='published'"}`).bind(slug).first();const item=r?decode(r) as Product:null;return item&&(all||isStartingProduct(item))?item:null;}
export async function listPosts(all=false){await ensureSeed();const {results}=await db().prepare(`SELECT * FROM posts ${all?'':"WHERE status='published'"} ORDER BY updated_at DESC`).all();const allowed=all?null:new Set((await listProducts()).map(i=>i.slug));return (results.map(decode) as Post[]).filter(p=>all||((!p.content.pageType||p.content.pageType==='article')&&(!p.content.primaryProduct||allowed?.has(p.content.primaryProduct))));}
export async function postBySlug(slug:string,all=false){await ensureSeed();const r=await db().prepare(`SELECT * FROM posts WHERE slug=? ${all?'':"AND status='published'"}`).bind(slug).first();const item=r?decode(r) as Post:null;if(item?.content.generationState==='planned'&&!await (await import('./auth')).isAdmin())return null;if(item?.content.primaryProduct){const parent=await productBySlug(item.content.primaryProduct,true);if(parent&&!isStartingProduct(parent)&&!await (await import('./auth')).isAdmin())return null;}return item;}
export async function listLeads(){const {results}=await db().prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500').all();return results.map(r=>({...r,payload:JSON.parse(r.payload as string),createdAt:r.created_at,updatedAt:r.updated_at})) as Lead[];}

export async function listHubs(all=false){return (await listPosts(true)).filter(p=>p.content.pageType&&p.content.pageType!=="article"&&(all||p.status==="published"));}

export async function listStartingProducts(){return (await listProducts(true)).filter(isStartingProduct);}
