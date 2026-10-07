import {z} from 'zod';
import {requireAdmin,assertSameOrigin,jsonBody} from '@/lib/auth';
import {db,ensureSeed} from '@/lib/db';
import {brokerMime,PRIMARY_BROKER} from '@/lib/broker-email';
import {briefFilename} from '@/lib/broker-brief';

export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const leadInput=z.object({kind:z.enum(['buyer','supplier']),id:z.string().min(1).max(100)});
const tokenInput=z.string().min(20).max(4096).regex(/^[A-Za-z0-9._~+\/-]+$/);
const clientIdInput=z.string().trim().max(250).regex(/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/,'Enter a Google OAuth web client ID.');
type MailRecord={status:string;attempt_id:string;sender:string;recipient:string;subject:string;attachment_name:string;updated_at:string;gmail_message_id:string};
const leadKey=(kind:string,id:string)=>`${kind}:${id}`;
const leadTable=(kind:string)=>kind==='buyer'?'leads':'supplier_leads';
async function clientId(){return (await db().prepare("SELECT value FROM admin_settings WHERE key='gmail_client_id'").first<{value:string}>())?.value||'';}
async function mailRecord(key:string){return db().prepare('SELECT status,attempt_id,sender,recipient,subject,attachment_name,updated_at,gmail_message_id FROM broker_mail WHERE lead_key=?').bind(key).first<MailRecord>();}
async function account(accessToken:string){
 const response=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Reconnect Gmail and allow email account access.');
 const profile=await response.json() as {email?:string;email_verified?:boolean};
 if(!profile.email_verified||!profile.email||!z.string().email().safeParse(profile.email).success)throw new Error('Google could not verify this email account.');
 return profile.email;
}
export async function GET(request:Request,{params}:{params:Promise<{operation:string}>}){
 try{await requireAdmin();}catch{return reply({error:'Administrator access is required.'},403);}
 try{
  const {operation}=await params;
  if(operation==='config'){await ensureSeed();const {results}=await db().prepare("SELECT id,name AS company,contact AS name,email FROM supply_partners WHERE active=1 AND email<>'' ORDER BY name").all();return reply({clientId:await clientId(),brokers:results});}
  if(operation==='status'){
   const parsed=leadInput.safeParse(Object.fromEntries(new URL(request.url).searchParams));
   if(!parsed.success)return reply({error:'Choose a lead.'},400);
   return reply({delivery:await mailRecord(leadKey(parsed.data.kind,parsed.data.id))});
  }
  return reply({error:'Unknown operation.'},404);
 }catch{return reply({error:'Email settings could not be loaded. Please try again.'},503);}
}
export async function POST(request:Request,{params}:{params:Promise<{operation:string}>}){
 try{await requireAdmin();assertSameOrigin(request);}catch{return reply({error:'Administrator access is required.'},403);}
 let raw:unknown;
 try{raw=await jsonBody(request,3_100_000);}catch{return reply({error:'The email request is invalid or too large.'},400);}
 const {operation}=await params;
 try{
  if(operation==='config'){
   const input=z.object({clientId:clientIdInput}).parse(raw);
   await db().prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('gmail_client_id',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(input.clientId,new Date().toISOString()).run();
   return reply({clientId:input.clientId});
  }
  if(operation==='account'){
   const input=z.object({accessToken:tokenInput}).parse(raw);
   if(!await clientId())return reply({error:'Complete Gmail setup first.'},409);
   try{return reply({email:await account(input.accessToken)});}catch{return reply({error:'Reconnect Gmail and allow email account access.'},401);}
  }
  if(operation==='resolve'){
   const input=leadInput.extend({attemptId:z.string().uuid(),outcome:z.enum(['sent','not-sent']),confirmed:z.literal(true)}).parse(raw);
   const key=leadKey(input.kind,input.id),now=new Date().toISOString();
   const result=await db().prepare("UPDATE broker_mail SET status=?,updated_at=? WHERE lead_key=? AND attempt_id=? AND (status='unknown' OR (status='pending' AND updated_at<?))").bind(input.outcome==='sent'?'confirmed':'failed',now,key,input.attemptId,new Date(Date.now()-120000).toISOString()).run();
   if(!result.meta.changes)return reply({error:'The email is still sending or its status changed. Refresh its delivery status.'},409);
   return reply({delivery:await mailRecord(key)});
  }
  if(operation!=='send')return reply({error:'Unknown operation.'},404);
  const input=leadInput.extend({updatedAt:z.string().datetime(),recipientId:z.string().min(1).max(100),attemptId:z.string().uuid(),accessToken:tokenInput,sender:z.string().email(),subject:z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/),body:z.string().trim().min(1).max(12000),pdfBase64:z.string().min(20).max(2_800_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),includeNotes:z.boolean(),confirmed:z.literal(true)}).parse(raw);
  if(!await clientId())return reply({error:'Complete Gmail setup first.'},409);
  let pdf:string;try{pdf=atob(input.pdfBase64);}catch{return reply({error:'The PDF attachment could not be read. Reopen the composer.'},400);}
  if(!pdf.startsWith('%PDF-')||pdf.length>2_000_000)return reply({error:'Attach the generated broker PDF, under 2 MB.'},400);
  const recipient=await db().prepare("SELECT contact AS name,name AS company,email FROM supply_partners WHERE id=? AND active=1").bind(input.recipientId).first<{name:string;company:string;email:string}>();
  if(!recipient||!z.string().email().safeParse(recipient.email).success)return reply({error:'Choose an active supply partner with a valid email address.'},400);
  const key=leadKey(input.kind,input.id),table=leadTable(input.kind);
  const previous=await mailRecord(key);
  if(previous&&previous.status!=='failed')return reply({error:['sent','confirmed'].includes(previous.status)?'This lead has already been emailed to the supplier.':'A send is already in progress or needs confirmation. Check Gmail before trying again.',delivery:previous},409);
  const lead=await db().prepare(`SELECT reference,updated_at FROM ${table} WHERE id=?`).bind(input.id).first<{reference:string;updated_at:string}>();
  if(!lead||lead.updated_at!==input.updatedAt)return reply({error:'This lead changed. Close the review and refresh the inbox before sending.'},409);
  let sender:string;
  try{sender=await account(input.accessToken);}catch{return reply({error:'Your Gmail connection expired. Reconnect Gmail before sending.'},401);}
  if(sender.toLowerCase()!==input.sender.toLowerCase())return reply({error:'The Gmail account changed. Reconnect and review the sender before sending.'},409);
  const filename=briefFilename({reference:lead.reference,title:'',sections:[]}),now=new Date().toISOString();
  const rawMessage=brokerMime({recipient,sender,subject:input.subject,body:input.body,pdfBase64:input.pdfBase64,filename,messageId:input.attemptId});
  // An atomic claim prevents repeat clicks, tabs, or retries from sending twice.
  const claim=await db().prepare(`INSERT INTO broker_mail (lead_key,attempt_id,lead_kind,lead_id,lead_updated_at,reference,recipient,sender,subject,body,include_notes,attachment_name,status,gmail_message_id,created_at,updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending','',?,?) ON CONFLICT(lead_key) DO UPDATE SET
   attempt_id=excluded.attempt_id,lead_updated_at=excluded.lead_updated_at,recipient=excluded.recipient,sender=excluded.sender,subject=excluded.subject,body=excluded.body,include_notes=excluded.include_notes,attachment_name=excluded.attachment_name,status='pending',gmail_message_id='',updated_at=excluded.updated_at WHERE broker_mail.status='failed' RETURNING attempt_id`)
   .bind(key,input.attemptId,input.kind,input.id,input.updatedAt,lead.reference,recipient.email,sender,input.subject,input.body,input.includeNotes?1:0,filename,now,now).first<{attempt_id:string}>();
  if(!claim)return reply({error:'This lead already has an active or completed send.',delivery:await mailRecord(key)},409);
  try{
   const response=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${input.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({raw:rawMessage}),signal:AbortSignal.timeout(25000)});
   if(!response.ok){
    const uncertain=response.status>=500;
    await db().prepare('UPDATE broker_mail SET status=?,updated_at=? WHERE lead_key=? AND attempt_id=?').bind(uncertain?'unknown':'failed',new Date().toISOString(),key,input.attemptId).run();
    return reply({error:uncertain?'Gmail did not confirm the result. Check Sent before trying again.':response.status===401?'Your Gmail connection expired. Reconnect and try again.':response.status===403?'Gmail denied sending. Enable the Gmail API for this Google project and grant permission to send email.':'Gmail rejected the message. Please try again later.',delivery:await mailRecord(key)},response.status===401?401:uncertain?502:400);
   }
   const sent=await response.json() as {id?:string};if(!sent.id)throw new Error('Unconfirmed send');
   const sentAt=new Date().toISOString();
   await db().batch([
    db().prepare("UPDATE broker_mail SET status='sent',gmail_message_id=?,updated_at=? WHERE lead_key=? AND attempt_id=?").bind(sent.id,sentAt,key,input.attemptId),
    db().prepare(`UPDATE ${table} SET broker=?,status=CASE WHEN status IN ('new','qualified','reviewing') THEN 'assigned' ELSE status END,updated_at=? WHERE id=? AND updated_at=?`).bind(`${recipient.name} · ${recipient.company}`,sentAt,input.id,input.updatedAt)
   ]);
   return reply({sent:true,delivery:await mailRecord(key)});
  }catch{
   // Never retry an uncertain external write automatically.
   try{await db().prepare("UPDATE broker_mail SET status='unknown',updated_at=? WHERE lead_key=? AND attempt_id=? AND status='pending'").bind(new Date().toISOString(),key,input.attemptId).run();}catch{/* A pending record also blocks another send. */}
   return reply({error:'Delivery could not be confirmed. Check Gmail Sent before trying again.',delivery:await mailRecord(key).catch(()=>null)},502);
  }
 }catch(error){return reply({error:error instanceof z.ZodError?'Please check the email fields and PDF attachment.':'The email operation could not be completed. Please refresh its delivery status.'},error instanceof z.ZodError?400:503);}
}
