import { getChatGPTUser } from '@/app/chatgpt-auth';
import { runtime } from './db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, validAdminSession } from './admin-session';
export async function adminIdentity(){const u=await getChatGPTUser();if(!u)return null;const allowed=(runtime().ADMIN_EMAILS || 'robert.eric.crews@gmail.com').toLowerCase().split(',').map(s=>s.trim());return allowed.includes(u.email.toLowerCase())?u:null;}
export function adminPasswordConfigured(){const env=runtime();return !!env.ADMIN_PASSWORD && (env.ADMIN_SESSION_SECRET?.length||0)>=32;}
export async function isAdmin(){const u=await adminIdentity();if(!u)return false;const env=runtime();if(!env.ADMIN_PASSWORD&&!env.ADMIN_SESSION_SECRET)return true;return validAdminSession((await cookies()).get(ADMIN_COOKIE)?.value,u.userId,env.ADMIN_PASSWORD||'',env.ADMIN_SESSION_SECRET||'');}
export async function requireAdmin(){if(!await isAdmin())throw new Error('Administrator access is required.');}
export function assertSameOrigin(request:Request){const value=request.headers.get('origin');if(!value || value!==new URL(request.url).origin)throw new Error('Invalid request origin.');}
export async function jsonBody(request:Request,max=100000){if(Number(request.headers.get('content-length')||0)>max)throw new Error('Request is too large.');const text=await request.text();if(text.length>max)throw new Error('Request is too large.');return JSON.parse(text);}
