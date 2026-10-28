import type {Metadata} from 'next';
import {listSellProducts} from '@/lib/supplier-db';
import {origin} from '@/lib/db';
import {jsonLd} from '@/lib/seo';
import {SellCatalog} from '@/components/site/sell-catalog';
import {Check,MessagesSquare,Trees} from 'lucide-react';
import styles from './sell.module.css';
export const dynamic='force-dynamic';
const description='Partner with Rarewood Exchange to connect buyers with hard-to-find wood. Mills, lumber yards, and specialty distributors can help us source materials as buyer requests come in.';
export const metadata:Metadata={title:'Supply Partners | Mills, Lumber Yards & Distributors',description,alternates:{canonical:'/sell'},openGraph:{title:'Supply Partners | Rarewood Exchange',description,url:'/sell',type:'website'}};
export default async function Sell(){
 const items=await listSellProducts();
 return <main id="main" className={`${styles.page} ${styles.directoryPage}`}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'CollectionPage',name:'Rarewood Exchange supply partners',url:origin()+'/sell',description,mainEntity:{'@type':'ItemList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:`Supply ${item.name}`,url:`${origin()}/sell/${item.slug}`}))}})}}/>
  <section className={`section ${styles.directoryHero}`}>
   <div className={styles.directoryCopy}>
    <span className="eyebrow">FOR SAWMILLS, LUMBER YARDS & SUPPLY PARTNERS</span>
    <h1>Good wood deserves<br/><span>the right connection.</span></h1>
    <p>Rarewood Exchange works with mills, lumber yards, and specialty distributors to help buyers find hard-to-source wood. As requests come in, we work directly with supply partners to confirm availability, pricing, and logistics.</p>
    <div className={styles.directoryActions}><a className={styles.directoryPrimary} href="#sell-directory">Explore materials we source</a><a className={styles.directorySecondary} href="/about#how-it-works">How it works</a></div>
    <div className={styles.heroPills}><span><Check size={17} aria-hidden="true"/> No fee to start a conversation</span><span><Check size={17} aria-hidden="true"/> No account needed</span><span><Check size={17} aria-hidden="true"/> Private contact details</span></div>
   </div>
   <figure className={styles.directoryScene}>
    <img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 900px) 100vw, 50vw" width={1672} height={941} alt="Illustrative hardwood boards and a live-edge slab in a woodshop" fetchPriority="high"/>
    <figcaption className={styles.sceneCopy}><span>From your inventory<br/>to the next<br/>right-fit buyer.</span><i/><small>People. Products.<br/>Better connections.</small></figcaption>
    <div className={styles.sceneNote}><Trees size={27} strokeWidth={1.4} aria-hidden="true"/><div><span>Work with Rarewood</span><p>Help us source the<br/>right material.</p></div></div>
   </figure>
  </section>
  <div className={`section ${styles.reviewNote}`}>When a buyer request fits your materials, we’ll contact you to confirm current availability and discuss the details. A specific lead, sale, price, or response time is not guaranteed.</div>
  <section className={`section ${styles.directory}`}><div className={styles.sectionHeading}><span className="eyebrow">MILLS · LUMBER YARDS · SPECIALTY DISTRIBUTORS</span><h2>What materials can you help us source?</h2></div><SellCatalog items={items}/></section>
  <section className={`section ${styles.directoryFooter}`}><MessagesSquare size={30}/><div><h2>A sourcing relationship with clear terms.</h2><p>Rarewood Exchange acts as a concierge, connecting buyer requests with supply partners and helping coordinate the sourcing conversation. We earn referral fees on completed referrals; compensation, freight, and other commercial terms are agreed with you before we proceed. Review our <a className="text-link" href="/about#how-it-works">sourcing process</a>.</p></div></section>
 </main>;
}
