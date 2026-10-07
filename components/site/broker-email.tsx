'use client';
import {useEffect,useId,useState} from 'react';
import {Mail,Send,Paperclip,Loader2,Check,ExternalLink} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {notifyLeadCountsChanged} from './lead-counts';
import {buyerBrief,supplierBrief} from '@/lib/broker-brief';
import {brokerEmailDraft,bytesBase64,gmailComposeUrl,PRIMARY_BROKER,type BrokerLead} from '@/lib/broker-email';
import {loadGmailClient,connectGmail,currentGmailConnection,forgetGmailConnection,type GmailConnection} from '@/lib/gmail-client';

type Delivery={status:string;attempt_id:string;sender:string;recipient:string;subject:string;attachment_name:string;updated_at:string;gmail_message_id:string};
type Recipient={id:string;name:string;company:string;email:string};
type MailResponse={brokers?:Recipient[];clientId:string;delivery:Delivery|null;sent?:boolean;error?:string};
type Props=BrokerLead&{disabled?:boolean;dirty?:boolean;onSent?:()=>void|Promise<void>;onBusyChange?:(busy:boolean)=>void};
const done=(delivery:Delivery|null)=>!!delivery&&['sent','confirmed'].includes(delivery.status);
export function BrokerEmail(props:Props){
 const [brokers,setBrokers]=useState<Recipient[]>([]),[recipientId,setRecipientId]=useState('');
 const recipient=brokers.find(b=>b.id===recipientId);
 const initial=brokerEmailDraft(props),notesId=useId(),confirmId=useId();
 const [open,setOpen]=useState(false),[subject,setSubject]=useState(initial.subject),[body,setBody]=useState(initial.body),[notes,setNotes]=useState(false);
 const [configLoaded,setConfigLoaded]=useState(false),[clientId,setClientId]=useState(''),[clientDraft,setClientDraft]=useState(''),[setup,setSetup]=useState(false),[googleReady,setGoogleReady]=useState(false),[connection,setConnection]=useState<GmailConnection|null>(()=>currentGmailConnection());
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[delivery,setDelivery]=useState<Delivery|null>(null),[checkedSent,setCheckedSent]=useState(false);
 const [attachment,setAttachment]=useState<{blob:Blob;url:string;filename:string;includeNotes:boolean;updatedAt:string}|null>(null),[pdfLoading,setPdfLoading]=useState(false),[statusLoaded,setStatusLoaded]=useState(false);
 const uncertain=!!delivery&&['pending','unknown'].includes(delivery.status);
 const canResolve=delivery?.status==='unknown'||(delivery?.status==='pending'&&Date.parse(delivery.updated_at)<Date.now()-120000);
 const key=`${props.kind}:${props.lead.id}`;
 const statusUrl='/api/admin/broker-email/status?'+new URLSearchParams({kind:props.kind,id:props.lead.id});
 useEffect(()=>{props.onBusyChange?.(!!busy);return()=>props.onBusyChange?.(false);},[busy,props.onBusyChange]);
 useEffect(()=>{if(!connection)return;const timer=setTimeout(()=>{forgetGmailConnection();setConnection(null);},Math.max(0,connection.expiresAt-Date.now()-60000));return()=>clearTimeout(timer);},[connection]);
 async function status(){const response=await fetch(statusUrl,{cache:'no-store'});const data=await response.json() as MailResponse;if(!response.ok)throw new Error(data.error||'Unable to check delivery status.');setDelivery(data.delivery);setStatusLoaded(true);return data.delivery as Delivery|null;}
 useEffect(()=>{
  let active=true;
  fetch(statusUrl,{cache:'no-store'}).then(async response=>{const data=await response.json() as MailResponse;if(response.ok&&active){setDelivery(data.delivery);setStatusLoaded(true);}}).catch(()=>{});
  return()=>{active=false;};
 },[key]);
 useEffect(()=>{
  if(!open)return;let active=true;
  setError('');setConfigLoaded(false);setStatusLoaded(false);setCheckedSent(false);
  Promise.all([fetch('/api/admin/broker-email/config',{cache:'no-store'}).then(async response=>{const data=await response.json() as MailResponse;if(!response.ok)throw new Error(data.error||'Unable to load Gmail settings.');if(active){setClientId(data.clientId);setClientDraft(data.clientId);setBrokers(data.brokers||[]);setRecipientId(current=>current||(data.brokers?.[0]?.id||''));setConfigLoaded(true);}}),status()]).catch(cause=>{if(active)setError(cause.message);});
  return()=>{active=false;};
 },[open,key]);
 useEffect(()=>{if(!open||!clientId)return;let active=true;setGoogleReady(false);loadGmailClient().then(()=>{if(active)setGoogleReady(true);}).catch(cause=>{if(active)setError(cause.message);});return()=>{active=false;};},[open,clientId]);
 useEffect(()=>{
  if(!open)return;let active=true;let url='';setPdfLoading(true);setAttachment(null);
  const brief=props.kind==='buyer'?buyerBrief(props.lead,notes):supplierBrief(props.lead,notes);
  import('@/lib/broker-pdf').then(module=>module.brokerPdfAttachment(brief)).then(file=>{if(active){url=URL.createObjectURL(file.blob);setAttachment({...file,url,includeNotes:notes,updatedAt:props.lead.updatedAt});}}).catch(cause=>{if(active)setError(cause.message);}).finally(()=>{if(active)setPdfLoading(false);});
  return()=>{active=false;if(url)URL.revokeObjectURL(url);};
 },[open,notes,key,props.lead.updatedAt]);
 async function saveSetup(){setBusy('setup');setError('');try{const response=await fetch('/api/admin/broker-email/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:clientDraft})});const data=await response.json() as MailResponse;if(!response.ok)throw new Error(data.error);forgetGmailConnection();setConnection(null);setClientId(data.clientId);setSetup(false);setNotice('Gmail setup saved. Connect your sending account below.');}catch(cause){setError(cause instanceof Error?cause.message:'Setup could not be saved.');}finally{setBusy('');}}
 function connect(){setBusy('connect');setError('');connectGmail(clientId).then(account=>{setConnection(account);setNotice('Gmail connected. Review the note and attachment, then send.');}).catch(cause=>setError(cause.message)).finally(()=>setBusy(''));}
 function disconnect(){if(connection)window.google?.accounts.oauth2.revoke(connection.token,()=>{});forgetGmailConnection();setConnection(null);setNotice('Gmail disconnected.');}
 async function sent(){try{await props.onSent?.();}catch{setNotice('The email was sent. Refresh the inbox to update the lead details.');}}
 async function send(){
  if(busy||!attachment||attachment.includeNotes!==notes||attachment.updatedAt!==props.lead.updatedAt||!connection||done(delivery)||uncertain)return;
  if(connection.expiresAt<Date.now()+60000){forgetGmailConnection();setConnection(null);setError('Reconnect Gmail before sending.');return;}
  setBusy('send');setError('');setNotice('');
  try{
   const pdfBase64=bytesBase64(new Uint8Array(await attachment.blob.arrayBuffer()));
   const response=await fetch('/api/admin/broker-email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:props.kind,id:props.lead.id,recipientId,updatedAt:props.lead.updatedAt,attemptId:crypto.randomUUID(),accessToken:connection.token,sender:connection.email,subject,body,pdfBase64,includeNotes:notes,confirmed:true})});
   const data=await response.json() as MailResponse;if(data.delivery)setDelivery(data.delivery);
   if(!response.ok){if(response.status===401){forgetGmailConnection();setConnection(null);}throw new Error(data.error||'Gmail did not confirm delivery.');}
   setNotice(`Sent to ${recipient?.name||'supply partner'} with the PDF attached.`);notifyLeadCountsChanged();await sent();
  }catch(cause){setError(cause instanceof Error?cause.message:'The result could not be confirmed. Check Gmail Sent before trying again.');setStatusLoaded(false);try{await status();}catch{setError('Delivery status is unavailable. Check Gmail Sent and refresh this review before trying again.');}}
  finally{setBusy('');}
 }
 async function resolve(outcome:'sent'|'not-sent'){
  if(!delivery||!checkedSent)return;setBusy('resolve');setError('');
  try{const response=await fetch('/api/admin/broker-email/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:props.kind,id:props.lead.id,attemptId:delivery.attempt_id,outcome,confirmed:true})});const data=await response.json() as MailResponse;if(!response.ok)throw new Error(data.error);setDelivery(data.delivery);notifyLeadCountsChanged();setCheckedSent(false);setNotice(outcome==='sent'?'Marked as sent after your Gmail check.':'Marked as not sent. You can send the lead now.');}catch(cause){setError(cause instanceof Error?cause.message:'Could not save the delivery check.');}finally{setBusy('');}
 }
 return <div className="broker-email-action"><button type="button" className="button dark" disabled={props.disabled||props.dirty} onClick={()=>setOpen(true)}>{done(delivery)?<Check size={16}/>:<Mail size={16}/>} {done(delivery)?'View broker email':'Send to broker'}</button>{props.dirty&&<small>Save your lead changes before sending.</small>}{done(delivery)&&<small>Sent to {delivery!.recipient} · {new Date(delivery!.updated_at).toLocaleString()}</small>}
 <Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}><DialogContent className="broker-email-dialog"><DialogHeader><DialogTitle>{done(delivery)?'Broker email sent':'Send this lead to a supply partner'}</DialogTitle><DialogDescription>{props.lead.reference} · {props.kind==='buyer'?'Buyer sourcing request':'Seller inventory inquiry'}</DialogDescription></DialogHeader>
 <div className="broker-email-recipient"><span>TO</span>{done(delivery)?<b>{delivery!.recipient}</b>:<label className="field"><span>Supply partner</span><select value={recipientId} disabled={!!busy||uncertain} onChange={e=>setRecipientId(e.target.value)}><option value="">Choose a partner</option>{brokers.map(b=><option key={b.id} value={b.id}>{b.company} · {b.name} · {b.email}</option>)}</select><small>Add or edit recipients under Sourcing operations → Supply partners.</small></label>}</div>
 {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
 {done(delivery)?<section className="broker-email-confirmation"><Check size={26}/><h3>{delivery!.status==='confirmed'?'You confirmed this email was sent.':'Gmail confirmed this email was sent.'}</h3><p>From {delivery!.sender}<br/>{new Date(delivery!.updated_at).toLocaleString()}</p><p><b>{delivery!.subject}</b></p><p><Paperclip size={16}/> {delivery!.attachment_name}</p><a href="https://mail.google.com/mail/#sent" target="_blank" rel="noreferrer" className="text-link">Open Gmail Sent <ExternalLink size={14}/></a></section>:<>
 <label className="field"><span>Subject</span><input value={subject} maxLength={200} disabled={!!busy||uncertain} onChange={event=>setSubject(event.target.value)}/></label><label className="field"><span>Note to supplier</span><textarea rows={12} value={body} maxLength={12000} disabled={!!busy||uncertain} onChange={event=>setBody(event.target.value)}/></label>
 <div className="broker-email-attachment"><Paperclip size={20}/><div>{pdfLoading?<span>Preparing the lead PDF…</span>:attachment?<><b>{attachment.filename}</b><small>{Math.ceil(attachment.blob.size/1024)} KB · PDF attachment</small><a href={attachment.url} target="_blank" rel="noreferrer">Preview PDF</a><a href={attachment.url} download={attachment.filename}>Download PDF</a></>:<span>PDF unavailable. Close and reopen this review to try again.</span>}</div></div>
 <div className="sourcing-consent"><Checkbox id={notesId} checked={notes} disabled={!!busy||uncertain} onCheckedChange={value=>setNotes(value===true)}/><label htmlFor={notesId}>Include internal follow-up notes in the PDF</label></div>
 {uncertain?<section className="broker-email-connection"><h3>Check the previous send first.</h3><p>{delivery!.status==='pending'?'A send is still in progress. Refresh its status before taking further action.':'Gmail did not confirm whether this message was sent. Check your Sent folder to avoid a duplicate.'}</p><a href="https://mail.google.com/mail/#sent" target="_blank" rel="noreferrer" className="text-link">Open Gmail Sent</a><button type="button" className="button outline" disabled={!!busy} onClick={()=>status().catch(cause=>setError(cause.message))}>Refresh delivery status</button>{canResolve&&<><div className="sourcing-consent"><Checkbox id={confirmId} checked={checkedSent} onCheckedChange={value=>setCheckedSent(value===true)}/><label htmlFor={confirmId}>I checked Gmail Sent for this lead reference.</label></div><div className="broker-email-buttons"><button type="button" className="button outline" disabled={!checkedSent||!!busy} onClick={()=>resolve('sent')}>It was sent</button><button type="button" className="button outline" disabled={!checkedSent||!!busy} onClick={()=>resolve('not-sent')}>It was not sent</button></div></>}</section>:<>
 {!configLoaded?<p role="status">{error?'Gmail settings are unavailable. Close and reopen this review to try again.':'Loading Gmail settings…'}</p>:(!clientId||setup)?<section className="broker-email-setup"><h3>Connect Gmail to Rarewood Exchange</h3><p>One-time setup enables sending from your Gmail account with the PDF automatically attached.</p><ol><li>In Google Cloud, create a project and enable the Gmail API.</li><li>Set up Google Auth Platform. Add your sending account as a test user if the app is in testing.</li><li>Create an OAuth client of type <b>Web application</b>. Add <code>https://rarewoodexchange.com</code> as an authorized JavaScript origin. Also add any other domain you use to open this admin.</li><li>Add the send-email scope <code>https://www.googleapis.com/auth/gmail.send</code> and the basic <code>openid</code> and <code>email</code> scopes. Paste the client ID below.</li></ol><a href="https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid" target="_blank" rel="noreferrer" className="text-link">Google setup guide <ExternalLink size={14}/></a><label className="field"><span>Google OAuth client ID</span><input value={clientDraft} placeholder="123456789-example.apps.googleusercontent.com" disabled={!!busy} onChange={event=>setClientDraft(event.target.value)}/></label><button type="button" className="button dark" disabled={!!busy||!clientDraft.trim()} onClick={saveSetup}>{busy==='setup'?'Saving…':'Save Gmail setup'}</button>{clientId&&<button type="button" className="button outline" onClick={()=>setSetup(false)}>Cancel</button>}<details><summary>Send manually while setting up Gmail</summary><p>Download the PDF above, open this prefilled Gmail draft, and attach the downloaded PDF before sending. This option does not record an automatic send.</p><button type="button" className="button outline" onClick={()=>window.open(gmailComposeUrl(subject,body,recipient?.email||''),'_blank','noopener,noreferrer')}>Open Gmail draft</button></details></section>:<section className="broker-email-connection"><h3>{connection?'Your sending account':'Choose your Gmail account'}</h3>{connection?<><p><b>{connection.email}</b></p><button type="button" className="text-link" disabled={!!busy} onClick={disconnect}>Disconnect Gmail</button></>:<><p>Connect Gmail, then review and send. Connecting alone does not send an email.</p><button type="button" className="button outline" disabled={!!busy||!googleReady} onClick={connect}>{busy==='connect'?<Loader2 className="spin" size={16}/>:<Mail size={16}/>} {busy==='connect'?'Connecting…':googleReady?'Connect Gmail':'Loading Google…'}</button></>}<button type="button" className="text-link" disabled={!!busy} onClick={()=>setSetup(true)}>Gmail setup</button></section>}
 <div className="broker-email-send"><p>Send the note and attached PDF to {recipient?.email||'the selected partner'}.</p><button type="button" className="button dark" disabled={!!busy||!connection||!attachment||attachment.includeNotes!==notes||attachment.updatedAt!==props.lead.updatedAt||pdfLoading||!subject.trim()||!body.trim()||!statusLoaded||!clientId||!recipient} onClick={send}>{busy==='send'?<Loader2 size={17} className="spin"/>:<Send size={17}/>} {busy==='send'?'Sending…':'Send email + PDF'}</button></div>
 </>}
 </>}
 <button type="button" className="button outline" disabled={!!busy} onClick={()=>setOpen(false)}>{done(delivery)?'Done':'Close'}</button>
 </DialogContent></Dialog></div>;
}
