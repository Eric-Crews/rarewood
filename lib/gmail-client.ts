'use client';
export const GMAIL_SEND_SCOPE='https://www.googleapis.com/auth/gmail.send';
type GoogleToken={access_token?:string;expires_in?:number;scope?:string;error?:string};
type GoogleOAuth={initTokenClient(config:{client_id:string;scope:string;include_granted_scopes:boolean;callback:(token:GoogleToken)=>void;error_callback:(error:{type:string})=>void}):{requestAccessToken(options?:{prompt:string}):void};hasGrantedAllScopes(token:GoogleToken,...scopes:string[]):boolean;revoke(token:string,callback:(result:{successful:boolean})=>void):void};
declare global{interface Window{google?:{accounts:{oauth2:GoogleOAuth}};}}
export type GmailConnection={token:string;email:string;expiresAt:number};
let connection:GmailConnection|null=null;
export function currentGmailConnection(){if(connection&&connection.expiresAt<Date.now()+60000)connection=null;return connection;}
export function forgetGmailConnection(){connection=null;}
let loading:Promise<void>|null=null;
// Google access tokens stay in component memory; never localStorage or the database.
export function loadGmailClient(){
 if(window.google?.accounts.oauth2)return Promise.resolve();
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  const timer=setTimeout(()=>{script.remove();loading=null;reject(new Error('Google could not be loaded. Please try again.'));},15000);
  script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();loading=null;reject(new Error('Google could not be loaded. Please try again.'));};document.head.appendChild(script);
 });return loading;
}
// Call directly from the Connect Gmail click so browsers allow the account popup.
export function connectGmail(clientId:string):Promise<GmailConnection>{
 return new Promise((resolve,reject)=>{
  const oauth=window.google?.accounts.oauth2;if(!oauth){reject(new Error('Google is still loading. Please try again.'));return;}
  const client=oauth.initTokenClient({client_id:clientId,scope:`${GMAIL_SEND_SCOPE} openid email`,include_granted_scopes:false,
   error_callback:error=>reject(new Error(error.type==='popup_closed'?'Gmail connection cancelled.':'Allow the Google popup, then try again.')),
   callback:async response=>{
    if(response.error||!response.access_token){reject(new Error('Gmail permission was not granted.'));return;}
    if(!oauth.hasGrantedAllScopes(response,GMAIL_SEND_SCOPE)){reject(new Error('Allow sending email to connect Gmail.'));return;}
    try{const result=await fetch('/api/admin/broker-email/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:response.access_token})});const data=await result.json() as {email:string;error?:string};if(!result.ok)throw new Error(data.error||'Unable to verify your Gmail account.');connection={token:response.access_token,email:data.email,expiresAt:Date.now()+Number(response.expires_in||0)*1000};resolve(connection);}catch(error){reject(error);}
   }
  });client.requestAccessToken({prompt:'select_account'});
 });
}
