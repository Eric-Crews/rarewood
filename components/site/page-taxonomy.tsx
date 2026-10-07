import type {Content} from '@/lib/types';
import {listHubs} from '@/lib/db';
import {belongsToHub} from '@/lib/content-graph';
export async function PageTaxonomy({content,category=''}:{content:Content;category?:string}){const hubs=await listHubs();const selected=hubs.filter(h=>belongsToHub({content,category},h));if(!selected.length)return null;return <nav className="managed-taxonomy" aria-label="Categories and topics"><span>Explore:</span>{selected.map(h=><a href={`/collections/${h.slug}`} key={h.id}>{h.title}{h.content.categoryScope?.market&&h.content.categoryScope.category?` · ${h.content.categoryScope.market}`:''}</a>)}</nav>;}
