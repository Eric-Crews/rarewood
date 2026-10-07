import type {Metadata} from 'next';
import {MapPin,Trees,ClipboardList,Handshake,Leaf,UsersRound,ShieldCheck,Check} from 'lucide-react';
import {SourcingCTA} from '@/components/site/editorial';
import {origin} from '@/lib/db';
import {jsonLd} from '@/lib/seo';
import styles from './about.module.css';

const description='Meet Rarewood Exchange, an independent product sourcing platform published by AdvGuides, LLC in Asheville, NC and operated by Eric Crews.';
export const metadata:Metadata={
  title:'About Us',
  description,
  alternates:{canonical:'/about'},
  openGraph:{title:'About Us | Rarewood Exchange',description,url:'/about',type:'website'},
};

const steps=[
  {title:'Find the product',text:'Explore product forms, applications, and buying considerations before you source in bulk.',details:'Forms · Applications · Specifications',href:'/products'},
  {title:'Share your requirements',text:'Tell us what you need and where it’s going. A clear brief gives brokers a useful starting point.',details:'Form · Grade · Quantity · Location · Timing',href:'/request'},
  {title:'Work through the details',text:'A relevant lumber broker helps work through the offered product and the commercial details.',details:'Availability · Pricing · Delivery · Terms'},
];
const principles=[
  {Icon:Leaf,title:'Start with the product',text:'The right form and grade for the intended use.'},
  {Icon:UsersRound,title:'Bring in the right expertise',text:'Lumber suppliers help connect buyers and providers.'},
  {Icon:ShieldCheck,title:'Make the terms clear',text:'Confirm the specifications and commercial details for each order.'},
];
const briefDetails=['Product form and grade','Required documentation','Order volume','Receiving capabilities','Delivery timing','Commercial terms'];

export default function About(){
  const base=origin();
  const schema={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'AboutPage','@id':`${base}/about#page`,url:`${base}/about`,name:'About Rarewood Exchange',description,mainEntity:{'@id':`${base}/#organization`},publisher:{'@id':`${base}/about#publisher`},breadcrumb:{'@id':`${base}/about#breadcrumb`}},
      {'@type':'Organization','@id':`${base}/#organization`,name:'Rarewood Exchange',url:base,description:'An independent publishing and product sourcing platform connecting commercial buyers with providers through lumber suppliers.',parentOrganization:{'@id':`${base}/about#publisher`}},
      {'@type':'Organization','@id':`${base}/about#publisher`,name:'AdvGuides, LLC',description:'A publishing company based in Asheville, North Carolina, operated by Eric Crews.',address:{'@type':'PostalAddress',addressLocality:'Asheville',addressRegion:'NC',addressCountry:'US'}},
      {'@type':'Person','@id':`${base}/about#eric-crews`,name:'Eric Crews',jobTitle:'Writer and web developer',description:'A writer and web developer with more than 20 years of experience creating high-quality websites. Eric operates AdvGuides, LLC, publisher of Rarewood Exchange.',worksFor:{'@id':`${base}/about#publisher`}},
      {'@type':'BreadcrumbList','@id':`${base}/about#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Rarewood Exchange',item:base},{'@type':'ListItem',position:2,name:'About us',item:`${base}/about`}]},
    ],
  };

  return <main id="main" className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>
    <section className={`section ${styles.intro}`} aria-labelledby="about-title">
      <div className={styles.introCopy}>
        <span className={styles.eyebrow}>ABOUT RAREWOOD EXCHANGE</span>
        <h1 id="about-title">Connecting supply.<br/><span>Supporting buyers.</span></h1>
        <p>Rarewood Exchange helps commercial buyers connect with product providers through lumber suppliers. Independently operated by AdvGuides, LLC, we help woodworkers, builders, and businesses specify the material they need and request a supplier-confirmed quote.</p>
        <a className={`button ${styles.goldButton}`} href="#how-it-works">How the sourcing process works</a>
      </div>
      <div className={styles.landscape}>
        <img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 900px) 100vw, 52vw" width={1672} height={941} alt="Illustrative hardwood workshop with stacked boards and live-edge slabs" fetchPriority="high"/>
        <div className={styles.landscapeCaption}>
          <span className={styles.eyebrow}>DISTINCTIVE WOOD. USEFUL CONNECTIONS.</span>
          <p>Connecting the people, products and opportunities to build a brighter tomorrow.</p>
        </div>
        <p className={styles.landscapeNote}>Real products.<br/>Real opportunities.<span/></p>
      </div>
    </section>

    <section className={`section ${styles.publisher}`} aria-label="The people behind Rarewood Exchange">
      <article className={styles.publisherPanel} aria-labelledby="publisher-title">
        <Trees className={styles.publisherWatermark} aria-hidden="true" strokeWidth={.7}/>
        <div className={styles.publisherCopy}>
          <span className={styles.eyebrow}>THE COMPANY BEHIND THE PLATFORM</span>
          <h2 id="publisher-title">Independent publishing.<br/><span>Built in Asheville.</span></h2>
          <p>Rarewood Exchange is published by <strong>AdvGuides, LLC</strong>, a publishing company based in Asheville, North Carolina.</p>
          <div className={styles.publisherLocation}><MapPin size={19}/><span>Asheville, North Carolina <span aria-hidden="true">·</span> Independent publisher</span></div>
        </div>
        <figure className={styles.cityPhoto}>
          <img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 600px) 90vw, (max-width: 1100px) 30vw, 200px" width={1000} height={750} alt="Illustrative woodshop with hardwood boards" loading="lazy" decoding="async"/>
          <figcaption>The material<br/>comes first.<span/></figcaption>
        </figure>
      </article>
      <article className={styles.operator} aria-labelledby="operator-title">
        <div className={styles.operatorPhoto}><img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 600px) 90vw, 35vw" width={1200} height={900} alt="Illustrative workshop with distinctive wood and natural light" loading="lazy" decoding="async"/></div>
        <div className={styles.operatorCopy}>
          <span className={styles.eyebrow}>OPERATED BY ERIC CREWS</span>
          <h2 id="operator-title">A publishing background.<br/><span>A practical purpose.</span></h2>
          <p>Eric Crews is a writer and web developer with more than 20 years of experience creating high-quality websites. He operates AdvGuides, LLC and brings that experience to the development of Rarewood Exchange.</p>
          <p>The goal is straightforward: make product information easier to understand, help buyers ask useful questions, and give brokers a clear starting point for connecting those buyers with providers.</p>
        </div>
      </article>
    </section>

    <section id="how-it-works" className={`section ${styles.process}`} aria-labelledby="process-title">
      <header className={styles.processHeading}>
        <div>
          <span className={styles.eyebrow}>HOW IT WORKS</span>
          <h2 id="process-title">A better brief.<br/>A more useful conversation.</h2>
        </div>
        <p>Clear requirements give a broker the context to assess a potential supply match. Start with the product, share the details, and move the conversation forward.</p>
      </header>
      <ol className={styles.steps}>
        {steps.map((step,index)=><li key={step.title}>
          <div className={styles.stepVisual} aria-hidden="true">
            <span className={styles.stepNumber}>0{index+1}</span>
            <span className={styles.stepArtwork}>{index===0?<img src="/images/wood/lumber-engraving-small.webp" alt="" width={240} height={240} loading="lazy" decoding="async"/>:index===1?<ClipboardList strokeWidth={1}/>:<Handshake strokeWidth={1}/>}</span>
          </div>
          <div className={styles.stepBody}>
            <h3>{step.href?<a href={step.href}>{step.title}</a>:step.title}</h3>
            <p>{step.text}</p>
            <span className={styles.stepDetails}>{step.details}</span>
          </div>
        </li>)}
      </ol>
    </section>

    <section className={`section ${styles.approach}`} aria-labelledby="approach-title">
      <div className={styles.principlesPanel}>
        <img className={styles.principlesArtwork} src="/images/wood/lumber-engraving.webp" alt="" width={512} height={512} loading="lazy" decoding="async" aria-hidden="true"/>
        <div className={styles.principlesContent}>
          <span className={styles.eyebrow}>OUR APPROACH TO SOURCING</span>
          <h2 id="approach-title">Specific requirements.<br/><span>Clear expectations.</span></h2>
          <ul className={styles.principles}>
            {principles.map(({Icon,title,text})=><li key={title}><span className={styles.principleIcon}><Icon size={20} strokeWidth={1.4} aria-hidden="true"/></span><div><h3>{title}</h3><p>{text}</p></div></li>)}
          </ul>
        </div>
      </div>
      <div className={styles.approachCopy}>
        <span className={styles.checklistEyebrow}>A USEFUL STARTING POINT</span>
        <h3>What helps create a workable sourcing brief</h3>
        <p>A few specific details help a broker understand the product you need and the practical requirements of your order.</p>
        <ul className={styles.briefChecklist}>{briefDetails.map(detail=><li key={detail}><span><Check size={13} strokeWidth={2.4} aria-hidden="true"/></span>{detail}</li>)}</ul>
        <div className={styles.confirmationNote}>
          <p>Rarewood Exchange is an independent brokerage and publishing platform. We may earn a commission on an arranged sale. The supply partner confirms the actual material, final quote, payment, and fulfillment terms; delivery arrangements are agreed for each order.</p>
        </div>
        <p className={styles.privacyNote}>We use your contact details and requirements to review inquiries and support broker follow-up. <a href="/privacy">Read our privacy policy.</a></p>
      </div>
    </section>
    <SourcingCTA/>
  </main>;
}
