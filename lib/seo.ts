import { origin } from './db';
export function jsonLd(data:unknown){return JSON.stringify(data).replace(/</g,'\\u003c');}
export function breadcrumb(name:string,path:string,parent='Products',parentPath='/products'){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Rarewood Exchange',item:origin()},{'@type':'ListItem',position:2,name:parent,item:origin()+parentPath},{'@type':'ListItem',position:3,name,item:origin()+path}]};}
