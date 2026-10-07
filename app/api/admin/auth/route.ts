import {adminIdentity,adminPasswordConfigured,assertSameOrigin,jsonBody} from '@/lib/auth';
import {db,runtime} from '@/lib/db';
import {adminCookie,createAdminSession,passwordMatches} from '@/lib/admin-session';

export const dynamic='force-dynamic';
const reply=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie',...headers}});
export async function POST(request:Request){
  let user;
  try{assertSameOrigin(request);user=await adminIdentity();if(!user)return reply({error:'Administrator access is required.'},403);}catch{return reply({error:'Administrator access is required.'},403);}
  if(!adminPasswordConfigured())return reply({error:'Password access is being configured. Please try again shortly.'},503);
  let password:unknown;
  try{password=(await jsonBody(request,4096)).password;if(typeof password!=='string'||!password||password.length>1024)throw new Error();}catch{return reply({error:'Enter your administrator password.'},400);}
  try{
    // One atomic counter per authorized identity, shared across worker instances.
    const now=Math.floor(Date.now()/1000),windowSeconds=15*60;
    const attempt=await db().prepare(`INSERT INTO admin_login_attempts (user_id,window_start,attempts) VALUES (?,?,1)
      ON CONFLICT(user_id) DO UPDATE SET
      attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,
      window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END
      RETURNING attempts,window_start`).bind(user.userId,now,now-windowSeconds,now-windowSeconds).first<{attempts:number;window_start:number}>();
    if(!attempt)throw new Error();
    if(attempt.attempts>5)return reply({error:'Too many attempts. Please try again in 15 minutes.'},429,{'Retry-After':String(Math.max(1,attempt.window_start+windowSeconds-now))});
    const env=runtime();
    if(!await passwordMatches(password as string,env.ADMIN_PASSWORD||''))return reply({error:'Incorrect password. Please try again.'},401);
    const token=await createAdminSession(user.userId,env.ADMIN_PASSWORD||'',env.ADMIN_SESSION_SECRET||'');
    await db().prepare('DELETE FROM admin_login_attempts WHERE user_id=?').bind(user.userId).run();
    return reply({ok:true},200,{'Set-Cookie':adminCookie(token)});
  }catch{return reply({error:'Unable to unlock the workspace. Please try again shortly.'},503);}
}
export async function DELETE(request:Request){
  try{assertSameOrigin(request);if(!await adminIdentity())return reply({error:'Administrator access is required.'},403);}catch{return reply({error:'Administrator access is required.'},403);}
  return reply({ok:true},200,{'Set-Cookie':adminCookie('',0)});
}
