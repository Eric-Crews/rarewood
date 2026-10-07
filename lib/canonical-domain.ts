const primaryOrigin='https://rarewoodexchange.com';
const publicHosts=new Set(['rarewoodexchange.com','www.rarewoodexchange.com','rarewood-exchange.advguides.chatgpt.site']);

// Only enable the domain move after the production origin has been configured.
// Keep authentication, admin sessions, form POSTs and assets on their original host.
export function canonicalRedirect(request:Request,siteUrl?:string):Response|null{
  if(siteUrl?.replace(/\/$/,'')!==primaryOrigin||!['GET','HEAD'].includes(request.method))return null;
  const url=new URL(request.url);
  if(!publicHosts.has(url.hostname)||url.origin===primaryOrigin)return null;
  if(!/^\/(?:$|(?:species|products|insights|collections|sell)(?:\/|$)|(?:categories|about|privacy|request|sitemap\.xml|robots\.txt)\/?$)/.test(url.pathname))return null;
  url.protocol='https:';url.host='rarewoodexchange.com';url.username='';url.password='';
  return new Response(null,{status:308,headers:{Location:url.href,'Cache-Control':'public, max-age=300'}});
}
