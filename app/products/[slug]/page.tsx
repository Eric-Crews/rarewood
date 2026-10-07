import {availableLots} from '@/lib/wood-db';
import {IllustrationImage} from '@/components/site/illustration-image';
import {productIllustrations} from '@/lib/product-illustrations';
import artwork from '@/components/site/product-artwork.module.css';
import {canSellProduct} from '@/lib/supplier-content';
import {publicContent} from '@/lib/public-content';
import {isStartingProduct} from '@/lib/catalog-availability';
import {isAdmin} from '@/lib/auth';
import {categoryPeers,productScopes,categorySlug,primaryProduct} from '@/lib/content-graph';
import {ProductPostcards,ProductInsights} from '@/components/site/product-postcards';
import {PageTaxonomy} from '@/components/site/page-taxonomy';
import {notFound} from 'next/navigation';
import {ArrowDown,ArrowRight,BarChart3,Check,FileCheck2,MapPin,MessagesSquare,PackageCheck,ShieldCheck,Sparkles,Truck} from 'lucide-react';
import {productBySlug,listStartingProducts,listPosts,origin} from '@/lib/db';
import {jsonLd,breadcrumb} from '@/lib/seo';
import {CategoryIcon} from '@/components/site/catalog';
import {ContentBody,RelatedProducts} from '@/components/site/editorial';
import {ProductQuoteForm} from '@/components/site/product-quote-form';
import {landingProfiles} from '@/lib/landing-profiles';

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const stored=await productBySlug((await params).slug,true);
  const r=stored?{...stored,content:publicContent(stored.content)}:undefined;
  if(r&&!isStartingProduct(r)&&!await isAdmin())return {title:'Product not found',robots:{index:false}};
  const profile=r?(r.content.landingProfile||landingProfiles[r.slug]):undefined;
  return r?{
    title:{absolute:r.content.seoTitle},
    description:r.content.seoDescription,
    alternates:{canonical:`/products/${r.slug}`},
    robots:r.status==='published'?undefined:{index:false,follow:false},
    openGraph:{title:profile?`Bulk ${profile.displayName} Sourcing`:r.content.seoTitle,description:r.content.seoDescription}
  }:{title:'Product not found',robots:{index:false}};
}

export default async function Product({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{destination?:string}>}){
  const stored=await productBySlug((await params).slug,true);
  const r=stored?{...stored,content:publicContent(stored.content)}:undefined;
  if(!r||((r.status!=='published'||!isStartingProduct(r))&&!await isAdmin()))notFound();
  const [all,posts,incoming]=await Promise.all([listStartingProducts(),listPosts(true),searchParams]);
  const profile=r.content.landingProfile||landingProfiles[r.slug];
  const related=categoryPeers(r,all.filter(p=>p.status==='published'));
  const lots=await availableLots(r.slug);
  const articles=posts.filter(p=>(!p.content.pageType||p.content.pageType==='article')&&primaryProduct(p)===r.slug&&(r.status==='draft'||p.status==='published'));
  const scopes=productScopes(r);const primaryScope=scopes[0];
  const placements=r.content.catalogPlacements||[];
  const markets=[...new Set(placements.map(p=>p.market))];
  const name=profile?.displayName||r.name;
  const aliases=r.content.aliases||[];
  const faqs=r.content.customLayout?r.content.faqs:profile?.faqs||r.content.faqs;
  const productJson={'@context':'https://schema.org','@type':'Product',name,alternateName:aliases,description:r.summary,category:placements.map(p=>`${p.market} / ${p.category}`).join(', ')||r.category,url:origin()+`/products/${r.slug}`,...(r.image?{image:new URL(r.image,origin()).href}:{})};
  const faqJson=faqs.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}:null;

  return <main id="main" className="product-page product-page-v2">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'Products',item:origin()+'/products'},{name:primaryScope.category||primaryScope.market,item:origin()+`/collections/${categorySlug(primaryScope)}`},{name,item:origin()+`/products/${r.slug}`}].map((v,i)=>({'@type':'ListItem',position:i+1,...v}))})}}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(productJson)}}/>
    {faqJson&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(faqJson)}}/>}

    {r.status==='draft'&&<div className="draft-preview-bar"><span>Design preview</span><p>This product page is excluded from search indexing while its content and UI are reviewed.</p></div>}

    <section className="product-hero product-v2-hero section">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/products">Products</a><span>/</span>{primaryScope.market&&<><a href={`/collections/${categorySlug({market:primaryScope.market})}`}>{primaryScope.market}</a><span>/</span></>}<a href={`/collections/${categorySlug(primaryScope)}`}>{primaryScope.category||r.category}</a><span>/</span><span>{name}</span></nav>
      <div className="product-hero-grid">
        <div className="product-hero-content">
          <div className="product-badges">{(profile?.badges||[placements[0]?.category||r.category,'Commercial quantities','Broker-confirmed terms']).map((badge,index)=><span className={index===0?'primary':''} key={badge}>{badge}</span>)}</div>
          <p className="product-v2-kicker"><Sparkles size={14}/> Wood, with a clear specification</p>
          <h1>{r.name}<span>Specialty wood sourcing</span></h1>
          {aliases.length>0&&<p className="product-aliases">Also searched as {aliases.join(', ')}</p>}
          <p className="product-lede">{r.summary}</p>
          <div className="product-v2-actions"><a className="button lime" href="#quote">Request pricing <ArrowRight size={16}/></a>{articles[0]&&<a className="product-v2-text-link" href={`/insights/${articles[0].slug}`}>Open buyer’s guide <ArrowRight size={15}/></a>}</div>

          {profile&&profile.facts.length>0&&<dl className="product-quick-facts" aria-label="Product at a glance">{profile.facts.slice(0,3).map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}

          <div className="product-v2-brief"><div className="product-v2-brief-head"><span><ShieldCheck size={18}/></span><div><small>QUOTE READINESS</small><b>What to include in the first message</b></div></div><ul className="product-highlights">{(profile?.highlights||r.content.buyingChecklist).map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul></div>
        </div>
        <aside className="product-quote-card" id="quote"><ProductQuoteForm product={name} defaultUnit={r.content.wood?.unit} defaultDestination={incoming.destination||''}/></aside>
      </div>
    </section>
    {lots.length>0&&<section className="section wood-lots"><span className="eyebrow">RECENTLY CONFIRMED</span><h3>Ask about these available lots.</h3>{lots.map(lot=><div key={String(lot.id)} className="wood-lot"><b>{String(lot.quantity)} {String(lot.unit)}</b><span>{String(lot.dimensions)} · {String(lot.location)}</span><small>Supplier reference {String(lot.reference)} · Confirmed {String(lot.confirmed_at).slice(0,10)}</small><a className="text-link" href="#quote">Request lot pricing</a></div>)}<p>Final allocation and specifications are confirmed with your quote.</p></section>}
    {canSellProduct(r)&&<div className="seller-crosslink"><span>Have {name.toLowerCase()} available?</span><a className="text-link" href={`/sell/${r.slug}`}>Submit your inventory for free</a></div>}

    <nav className="product-v2-subnav" aria-label="Product page sections"><span>{r.name} sourcing brief</span><div><a href="#product-details">Overview</a>{profile&&profile.specifications.rows.length>0&&<a href="#specifications">Specifications</a>}<a href="#applications">Applications</a>{profile&&profile.shipping.length>0&&<a href="#delivery">Delivery</a>}{faqs.length>0&&<a href="#questions">FAQ</a>}</div><a href="#quote">Build a request <ArrowRight size={14}/></a></nav>

    {r.content.speciesSlug&&<div className="section wood-species-link"><a href={`/species/${r.content.speciesSlug}`}>Explore the species and other product forms →</a></div>}<PageTaxonomy content={r.content} category={r.category}/><section className="product-section section product-v2-overview" id="product-details">
      {r.image&&<figure className="managed-product-image"><img width={1200} height={400} loading="lazy" decoding="async" src={r.image} alt={r.content.imageAlt||name}/>{r.imageCredit&&<figcaption>{r.imageCredit.split(" · ")[0]}</figcaption>}</figure>}
      <div className="product-section-heading"><div><span className="eyebrow">ABOUT THE PRODUCT</span><h2>{`About ${r.name.toLowerCase()}`}</h2></div><div className={artwork.overviewArt}><IllustrationImage candidates={productIllustrations(r)} decorative={false} sizes="128px"/></div></div>
      <div className="product-overview">{(profile?.overview||r.content.sections.flatMap(s=>s.paragraphs).slice(0,2)).map((paragraph,index)=><div key={paragraph}><span>0{index+1}</span><p>{paragraph}</p></div>)}</div>
      <div className="product-benefit-grid" data-count={profile?.benefits.length||0}>{(profile?.benefits||[]).map((item,index)=><article key={item.title}><span>{index===0?<BarChart3/>:index===1?<FileCheck2/>:<Truck/>}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>

    {profile&&profile.specifications.rows.length>0?<section className="product-section product-section-tint" id="specifications"><div className="section product-spec-layout">
      <div><span className="eyebrow">SPECIFICATIONS</span><h2>{r.name} specifications.</h2><table className="product-spec-table"><caption>{profile.specifications.caption}</caption><thead><tr>{profile.specifications.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{profile.specifications.rows.map(row=><tr key={row[0]}>{row.map((cell,index)=>index===0?<th scope="row" key={cell}>{cell}</th>:<td key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table><p className="product-spec-note">{profile.specifications.note}</p></div>
      <aside className="product-spec-callout"><span className="eyebrow">BUILD THE RIGHT RFQ</span><h3>{r.name} buying checklist</h3><ul>{r.content.buyingChecklist.map(item=><li key={item}>{item}</li>)}</ul><a className="button dark" href="#quote">Request specs & pricing</a></aside>
    </div></section>:null}

    {r.content.customLayout&&r.content.sections.length>2&&<section className="section"><ContentBody content={{...r.content,sections:r.content.sections.slice(2),faqs:[],buyingChecklist:[]}}/></section>}
    <section className="product-section section" id="applications">
      <div className="product-section-heading"><div><span className="eyebrow">APPLICATIONS</span><h2>{`Common uses for ${r.name.toLowerCase()}.`}</h2></div></div>
      <div className="product-application-grid">{(profile?.applications||r.content.applications.map(item=>({title:item,text:''}))).map((item,index)=><article key={item.title}><span>0{index+1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>

    {profile&&profile.shipping.length>0&&<section className="product-section product-section-tint" id="delivery"><div className="section"><div className="product-section-heading"><div><span className="eyebrow">ORDERING & DELIVERY</span><h2>{r.name} delivery.</h2></div></div><div className="product-shipping-grid" data-count={profile.shipping.length}>{profile.shipping.map((item,index)=><article key={item.title}><span>{index===0?<Truck/>:index===1?<ArrowRight/>:<PackageCheck/>}</span><div><small>POINT 0{index+1}</small><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></div></section>}

    <section className="product-section product-section-dark"><div className="section product-market-layout"><div><span className="eyebrow">CATALOG PLACEMENT</span><h2>{name} categories</h2></div><div className="product-market-list">{placements.length?placements.map(p=><a href={`/collections/${categorySlug(p)}`} key={`${p.market}-${p.category}`}><CategoryIcon category={r.category}/><span><b>{p.market}</b><small>{p.category}</small></span></a>):<div><CategoryIcon category={r.category}/><span><b>Commercial products</b><small>{r.category}</small></span></div>}</div></div></section>

    <ProductPostcards items={related} browseHref={`/collections/${categorySlug(primaryScope)}`} browseLabel={`Browse ${primaryScope.category||r.category}`}/> 

    <ProductInsights posts={articles} name={name}/>

    {faqs.length>0&&<section className="product-section product-section-tint" id="questions"><div className="section product-faq-layout"><div><span className="eyebrow">COMMON QUESTIONS</span><h2>{`${r.name} sourcing questions.`}</h2></div><div className="faq-list">{faqs.map(f=><details key={f.question}><summary>{f.question}<span>+</span></summary><p>{f.answer}</p></details>)}</div></div></section>}

    <section className="product-final"><div><span className="eyebrow">START WITH A CLEAR BRIEF</span><h2>{`Ready to source ${r.name.toLowerCase()}?`}</h2><p>Send your volume, destination, and key specifications. A broker can follow up with availability and commercial terms.</p></div><a className="button lime" href="#quote">Request pricing & availability <ArrowRight size={16}/></a></section>
  </main>;
}
