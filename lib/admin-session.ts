// Server-only helpers. No password, key, or session token is returned in JSON.
export const ADMIN_COOKIE = '__Host-rwx-admin';
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();
function encode(value: Uint8Array) { return btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decode(value: string) { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
async function keyFor(password: string, secret: string) {
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(['rwx-admin-v1', secret, password])));
  return crypto.subtle.importKey('raw', material, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']);
}
export async function passwordMatches(candidate: string, password: string) {
  if (!password || candidate.length > 1024) return false;
  const [actual, expected] = await Promise.all([candidate, password].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const a = new Uint8Array(actual), b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
export async function createAdminSession(subject: string, password: string, secret: string, now = Date.now()) {
  if (!password || secret.length < 32) throw new Error('Administrator password access is not configured.');
  const issued = Math.floor(now / 1000);
  const payload = encode(encoder.encode(JSON.stringify({v: 1, sub: subject, iat: issued, exp: issued + ADMIN_SESSION_SECONDS, nonce: crypto.randomUUID()})));
  const signature = await crypto.subtle.sign('HMAC', await keyFor(password, secret), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function validAdminSession(token: string | undefined, subject: string, password: string, secret: string, now = Date.now()) {
  if (!token || token.length > 2048 || !password || secret.length < 32) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!await crypto.subtle.verify('HMAC', await keyFor(password, secret), decode(signature), encoder.encode(payload))) return false;
    const claims = JSON.parse(new TextDecoder().decode(decode(payload)));
    const seconds = Math.floor(now / 1000);
    return claims.v === 1 && claims.sub === subject && Number.isInteger(claims.iat) && Number.isInteger(claims.exp)
      && claims.iat <= seconds && claims.exp > seconds && claims.exp - claims.iat === ADMIN_SESSION_SECONDS;
  } catch { return false; }
}
export function adminCookie(token: string, maxAge = ADMIN_SESSION_SECONDS) {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
