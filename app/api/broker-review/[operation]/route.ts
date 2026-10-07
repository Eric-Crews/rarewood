import {z} from 'zod';
import {assertSameOrigin,jsonBody,requireAdmin} from '@/lib/auth';
import {db} from '@/lib/db';
import {ReviewError,actorForReviewToken,reviewCookie,requireReviewActor,reviewAccessInfo,createReviewAccess,brokerReviewItems,saveBrokerReview} from '@/lib/broker-review';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
const reply=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{...headers,...extra}});
function failure(error:unknown){if(error instanceof ReviewError)return reply({error:error.message},error.status);if(error instanceof z.ZodError||error instanceof SyntaxError)return reply({error:'Check the request and try again.'},400);console.error('Broker product review failed');return reply({error:'The review is temporarily unavailable. Your saved answers are safe. Please try again.'},503);}
type Context={params:Promise<{operation:string}>};
export async function GET(_request:Request,{params}:Context){try{
 const {operation}=await params;
 if(operation==='access'){try{await requireAdmin();}catch{return reply({error:'Administrator access is required.'},403);}return reply(await reviewAccessInfo());}
 if(operation!=='items')return reply({error:'Unknown operation.'},404);
 const actor=await requireReviewActor();return reply({items:await brokerReviewItems(),reviewer:actor.name});
 }catch(error){return failure(error);}}
export async function POST(request:Request,{params}:Context){try{
 try{assertSameOrigin(request);}catch{return reply({error:'Invalid request origin.'},403);}
 const {operation}=await params;
 if(operation==='access'){
  try{await requireAdmin();}catch{return reply({error:'Administrator access is required.'},403);}
  const input=z.object({action:z.enum(['create','revoke'])}).parse(await jsonBody(request,1000));
  if(input.action==='create')return reply(await createReviewAccess());
  await db().prepare('UPDATE broker_review_access SET revoked_at=? WHERE id=?').bind(new Date().toISOString(),'primary').run();return reply(await reviewAccessInfo());
 }
 if(operation==='connect'){
  const {token}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).parse(await jsonBody(request,1000));
  const actor=await actorForReviewToken(token);if(!actor)return reply({error:'This review link has expired or was replaced. Ask Rarewood Exchange for a new link.'},401);
  return reply({connected:true},200,{'Set-Cookie':reviewCookie(token)});
 }
 if(operation==='disconnect')return reply({ok:true},200,{'Set-Cookie':reviewCookie('',0)});
 if(operation!=='answer')return reply({error:'Unknown operation.'},404);
 const actor=await requireReviewActor();
 const input=z.object({id:z.string().min(1).max(160),answer:z.enum(['yes','no']),updatedAt:z.string().datetime(),revision:z.number().int().min(0),actionId:z.string().uuid()}).strict().parse(await jsonBody(request,2000));
 return reply({item:await saveBrokerReview(input,actor)});
 }catch(error){return failure(error);}}
