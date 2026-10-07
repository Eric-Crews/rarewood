import {origin} from '@/lib/db';
export async function GET(){return new Response(`User-agent: *\nAllow: /\nAllow: /api/media/\nDisallow: /admin\nDisallow: /broker/\nDisallow: /api/\nSitemap: ${origin()}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}});}
