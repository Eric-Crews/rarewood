import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {productBySlug,origin} from '@/lib/db';
import {listSellProducts} from '@/lib/supplier-db';
import {canSellProduct,sellProduct,supplierProfile,supplierFaqs} from '@/lib/supplier-content';
import {SupplierForm} from '@/components/site/supplier-form';
import {jsonLd} from '@/lib/seo';
import {Check,ClipboardList,MessagesSquare,Truck} from 'lucide-react';
import styles from '../sell.module.css';
export const dynamic='force-dynamic';
async function getItem(slug:string){const item=await productBySlug(slug,true);return item&&canSellProduct(item)?sellProduct(item):null;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const item=await getItem((await params).slug);if(!item)return {title:'Product not found',robots:{index:false,follow:false}};const title=`Looking to Sell ${item.name}? | Free Broker Submission`,description=`Sell bulk ${item.name.toLowerCase()}: share your quantity, location, and availability for free broker review. No account required. Sales and pricing are not guaranteed.`;return {title:{absolute:title+' | Rarewood Exchange'},description,alternates:{canonical:`/sell/${item.slug}`},openGraph:{title,description,url:`/sell/${item.slug}`,type:'website'}};}
export default async function SellProductPage({params}:{params:Promise<{slug:string}>}){
 const item=await getItem((await params).slug);if(!item)notFound();const profile=supplierProfile(item),faqs=supplierFaqs(item),url=`${origin()}/sell/${item.slug}`;
 const related=(await listSellProducts()).filter(other=>other.slug!==item.slug&&other.category===item.category).slice(0,6);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url+'#page',url,name:`Looking to sell ${item.name}?`,description:`Submit your available ${item.name.toLowerCase()} inventory for free broker review.`,mainEntity:{'@id':url+'#service'}},
  {'@type':'Service','@id':url+'#service',name:`${item.name} supplier submission`,serviceType:'No-fee supplier inventory submission for broker review',url,provider:{'@type':'Organization',name:'Rarewood Exchange',url:origin()},description:'Submit available inventory for free. A buyer, sale, price, and response time are not guaranteed. Transaction costs and commercial terms are agreed separately.'},
  {'@type':'BreadcrumbList',itemListElement:[{name:'Rarewood Exchange',item:origin()},{name:'Sell wood products',item:origin()+'/sell'},{name:`Sell ${item.name}`,item:url}].map((entry,index)=>({'@type':'ListItem',position:index+1,...entry}))},
  {'@type':'FAQPage',mainEntity:faqs.map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))},
 ]};
 return <main id="main" className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>
  <section className={`section ${styles.landingHero}`}>
   <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/sell">Sell wood products</a><span>/</span><span aria-current="page">{item.name}</span></nav>
   <div className={styles.heroGrid}><div className={styles.heroCopy}><span className="eyebrow">SELL BULK PRODUCTS · {profile.label}</span><h1>Looking to sell<br/><span>{item.name}?</span></h1><p>Have {item.name.toLowerCase()} available for pickup or delivery? Share your inventory with Rarewood Exchange for free. Give our team and a relevant lumber broker the details to explore potential buyer matches.</p><div className={styles.heroPills}><span><Check size={17}/> No fee to submit</span><span><Check size={17}/> No account required</span></div><a className={`button dark ${styles.mobileSubmit}`} href="#submit-inventory">Share my inventory</a><div className={styles.sellerSteps}>{[{Icon:ClipboardList,title:'Describe your available lot',body:'Share the quantity, location, and when it can move.'},{Icon:MessagesSquare,title:'Give brokers a useful brief',body:'Our team reviews submissions for relevant broker follow-up.'},{Icon:Truck,title:'Work toward agreed terms',body:'Buyer fit, specifications, price, and logistics are confirmed directly.'}].map(({Icon,title,body})=><div key={title}><Icon size={23}/><div><h2>{title}</h2><p>{body}</p></div></div>)}</div><p className={styles.noGuarantee}>A submission starts a review. It does not guarantee a buyer, sale, price, or response time.</p></div><SupplierForm item={item}/></div>
  </section>
  <section className={`section ${styles.preparation}`} aria-labelledby="lot-details"><div className={styles.sectionHeading}><span className="eyebrow">PREPARE YOUR {item.name.toUpperCase()} LOT</span><h2 id="lot-details">The details that help a broker.</h2><p>{profile.intro}</p></div><div className={styles.preparationGrid}>{profile.details.map((detail,index)=><article key={detail}><span>0{index+1}</span><h3>{['Product & form','Lot information','Storage & shipment'][index]}</h3><p>{detail}</p></article>)}</div><p className={styles.documentNote}>Share only specifications you can substantiate. If a test result, grade, or certification is unknown, say so; the broker can discuss what a potential buyer requires.</p></section>
  <section className={`section ${styles.faqSection}`} aria-labelledby="sell-faq"><div><span className="eyebrow">BEFORE YOU SUBMIT</span><h2 id="sell-faq">Selling {item.name.toLowerCase()}:<br/>your questions, answered.</h2>{item.buyerPublished&&<a href={`/products/${item.slug}`} className="text-link">Read the {item.name.toLowerCase()} buyer guide</a>}</div><div>{faqs.map(faq=><details key={faq.question} className={styles.faq}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
  {!!related.length&&<section className={`section ${styles.related}`}><span className="eyebrow">MORE PRODUCTS IN {item.category.toUpperCase()}</span><h2>Have another wood product available?</h2><div className={styles.relatedGrid}>{related.map(other=><a href={`/sell/${other.slug}`} key={other.id}><b>Sell {other.name}</b><span>Submit available inventory</span></a>)}</div><a href="/sell" className="text-link">View all products you can submit</a></section>}
 </main>;
}
