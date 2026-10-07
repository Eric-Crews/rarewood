import {ArrowRight,Layers,MessagesSquare,ShieldCheck,Trees} from 'lucide-react';
import styles from './home-hero.module.css';
export function HomeHero(){return <section className={styles.hero} aria-labelledby="home-title">
 <div className={styles.copy}>
  <div className={styles.copyInner}>
   <div className={styles.eyebrow}><span/>RARE WOOD. REAL POSSIBILITIES.</div>
   <h1 id="home-title">Exceptional wood.<br/><span>The right connections.</span></h1>
   <p>Discover exotic hardwoods, remarkable slabs, and specialty lumber. Tell us what your project needs. We’ll help you find the right supply.</p>
   <div className={styles.actions}><a className={`button ${styles.goldButton}`} href="/products">Explore the wood<ArrowRight size={23} strokeWidth={1.5} aria-hidden="true"/></a><a className={`button ${styles.outlineButton}`} href="/request">Request a quote</a></div>
   <div className={styles.benefits}>
    {[{Icon:Layers,text:<>Project & volume<br/>purchases</>},{Icon:ShieldCheck,text:<>Your dimensions.<br/>Your requirements.</>},{Icon:MessagesSquare,text:<>Personal sourcing<br/>follow-up</>}].map(({Icon,text},index)=><div key={index}><span className={styles.iconRing}><Icon size={23} strokeWidth={1.5}/></span><p>{text}</p></div>)}
   </div>
  </div>
 </div>
 <div className={styles.scene}>
  <img className={styles.photo} src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 900px) 100vw, 46vw" width={1536} height={1024} alt="Illustrative workshop scene with hardwood boards and live-edge slabs" fetchPriority="high"/>
  <p className={styles.sceneQuote}>Every great project<br/>starts with the material.<span/></p>
  <div className={styles.photoPanel}>
   <div><span className={styles.panelEyebrow}>FROM DISTINCTIVE MATERIAL TO FINISHED PROJECT</span><h2>A clearer route<br/>to what you need.</h2><p>LUMBER / SLABS / CONNECTIONS</p></div>
   <div className={styles.panelMark}><Trees size={36} strokeWidth={1.2} aria-hidden="true"/><span>PEOPLE<br/>PRODUCTS<br/>OPPORTUNITIES</span><i/></div>
  </div>
 </div>
 </section>}
