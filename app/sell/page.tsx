import type {Metadata} from 'next';
import {listSellProducts} from '@/lib/supplier-db';
import {origin} from '@/lib/db';
import {jsonLd} from '@/lib/seo';
import {SellCatalog} from '@/components/site/sell-catalog';
import {Check,MessagesSquare,Trees} from 'lucide-react';
import styles from './sell.module.css';
export const dynamic='force-dynamic';
const description='Have bulk wood products ready to sell? Submit available products to Rarewood Exchange for free and give lumber suppliers the details to assess potential buyer matches.';
export const metadata:Metadata={title:'Sell Bulk Wood Products | Free Supplier Submissions',description,alternates:{canonical:'/sell'},openGraph:{title:'Sell Bulk Wood Products | Rarewood Exchange',description,url:'/sell',type:'website'}};
export default async function Sell(){
 const items=await listSellProducts();
 return <main id="main" className={`${styles.page} ${styles.directoryPage}`}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'CollectionPage',name:'Sell bulk wood products',url:origin()+'/sell',description,mainEntity:{'@type':'ItemList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:`Sell ${item.name}`,url:`${origin()}/sell/${item.slug}`}))}})}}/>
  <section className={`section ${styles.directoryHero}`}>
   <div className={styles.directoryCopy}>
    <span className="eyebrow">FOR SAWMILLS, LUMBER YARDS & SUPPLY PARTNERS</span>
    <h1>Ready to sell?<br/><span>Start with <br/>what you have.</span></h1>
    <p>Connect your available wood products with a potential buyer. Share your product, quantity, location, and readiness to ship for our team and brokers to review.</p>
    <div className={styles.directoryActions}><a className={styles.directoryPrimary} href="#sell-directory">Choose your wood product</a><a className={styles.directorySecondary} href="/about#how-it-works">How it works</a></div>
    <div className={styles.heroPills}><span><Check size={17} aria-hidden="true"/> No fee to submit</span><span><Check size={17} aria-hidden="true"/> No account needed</span><span><Check size={17} aria-hidden="true"/> Private contact details</span></div>
   </div>
   <figure className={styles.directoryScene}>
    <img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 900px) 100vw, 50vw" width={1672} height={941} alt="Illustrative hardwood boards and a live-edge slab in a woodshop" fetchPriority="high"/>
    <figcaption className={styles.sceneCopy}><span>From your inventory<br/>to the next<br/>opportunity.</span><i/><small>People. Products.<br/>Better connections.</small></figcaption>
    <div className={styles.sceneNote}><Trees size={27} strokeWidth={1.4} aria-hidden="true"/><div><span>Ready to move forward?</span><p>Start with the details.<br/>Let’s make the connection.</p></div></div>
   </figure>
  </section>
  <div className={`section ${styles.reviewNote}`}>Choose a product below and submit your available lot for broker review. A buyer, sale, price, or response time is not guaranteed.</div>
  <section className={`section ${styles.directory}`}><div className={styles.sectionHeading}><span className="eyebrow">CHOOSE YOUR WOOD PRODUCT</span><h2>What are you looking to sell?</h2></div><SellCatalog items={items}/></section>
  <section className={`section ${styles.directoryFooter}`}><MessagesSquare size={30}/><div><h2>Commercial terms stay a conversation.</h2><p>Submitting availability is free. Any brokerage compensation, freight charges, and other transaction costs must be discussed separately and agreed before a deal. Review our <a className="text-link" href="/about#how-it-works">sourcing process</a>.</p></div></section>
 </main>;
}
