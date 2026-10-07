import {requireAdmin,assertSameOrigin,jsonBody} from '@/lib/auth';
import {db} from '@/lib/db';
import {listSupplierLeads} from '@/lib/supplier-db';
import {supplierStatuses,supplierUnits} from '@/lib/supplier-leads';
import {z} from 'zod';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{await requireAdmin();}catch{return reply({error:'Administrator access is required.'},403);}try{return reply({leads:await listSupplierLeads()});}catch{return reply({error:'The supplier inbox is unavailable. Please try again.'},503);}}
const update=z.object({id:z.string().uuid(),updatedAt:z.string().datetime(),status:z.enum(supplierStatuses),broker:z.string().trim().max(300),notes:z.string().trim().max(8000),quantity:z.number().finite().positive().max(1000000000),unit:z.enum(supplierUnits),availability:z.enum(['Ready now','Within 30 days','Discuss timing']),reconfirm:z.boolean().default(false)});
export async function POST(request:Request){
 try{await requireAdmin();assertSameOrigin(request);}catch{return reply({error:'Administrator access is required.'},403);}
 let raw:unknown;try{raw=await jsonBody(request,16000);}catch{return reply({error:'Please check the update.'},400);}
 const deletion=z.object({action:z.literal('delete'),id:z.string().uuid(),updatedAt:z.string().datetime()}).safeParse(raw);
 if(deletion.success){try{const key=`supplier:${deletion.data.id}`;const pending=await db().prepare("SELECT lead_key FROM broker_mail WHERE lead_key=? AND status IN ('pending','unknown')").bind(key).first();if(pending)return reply({error:'Check and resolve the pending broker email before deleting this inquiry.'},409);const results=await db().batch([db().prepare('DELETE FROM broker_mail WHERE lead_key=? AND EXISTS (SELECT 1 FROM supplier_leads WHERE id=? AND updated_at=?)').bind(key,deletion.data.id,deletion.data.updatedAt),db().prepare('DELETE FROM supplier_leads WHERE id=? AND updated_at=?').bind(deletion.data.id,deletion.data.updatedAt)]);return results[1].meta.changes?reply({deleted:true}):reply({error:'This inquiry changed or is no longer available. Refresh the inbox.'},409);}catch{return reply({error:'The inquiry could not be deleted.'},503);}}
 const parsed=update.safeParse(raw);
 if(!parsed.success)return reply({error:parsed.error.issues[0]?.message||'Please check the update.'},400);
 const data=parsed.data;
 try{const now=new Date().toISOString(),due=new Date(Date.parse(now)+7*86400000).toISOString();const result=await db().prepare('UPDATE supplier_leads SET status=?,broker=?,notes=?,quantity=?,unit=?,availability=?,updated_at=?,confirmed_at=CASE WHEN ? THEN ? ELSE confirmed_at END,review_due_at=CASE WHEN ? THEN ? ELSE review_due_at END WHERE id=? AND updated_at=?').bind(data.status,data.broker,data.notes,data.quantity,data.unit,data.availability,now,data.reconfirm?1:0,now,data.reconfirm?1:0,due,data.id,data.updatedAt).run();if(!result.meta.changes)return reply({error:'This inquiry changed or is no longer available. Refresh the inbox before editing.'},409);return reply({saved:true,updatedAt:now,...(data.reconfirm?{confirmedAt:now,reviewDueAt:due}:{})});}catch{return reply({error:'The update could not be saved. Please try again.'},503);}
}
