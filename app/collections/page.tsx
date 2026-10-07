import {ArrowRight} from 'lucide-react';
import {listHubs,listProducts,listPosts,origin} from '@/lib/db';
import {collectionDirectory} from '@/lib/collection-directory';
import {CollectionDirectory} from '@/components/site/collection-directory';
import {jsonLd} from '@/lib/seo';
import styles from './collections.module.css';

export const dynamic='force-dynamic';
export const metadata={title:'Product Collections, Categories & Markets',description:'Explore bulk product collections by market, product family, and sourcing topic. Find related products and practical buyer Insights.',alternates:{canonical:'/collections'}};

export default async function Collections(){
  const [hubs,products,posts]=await Promise.all([listHubs(),listProducts(),listPosts()]);
  const items=collectionDirectory(hubs,products,posts),url=origin()+'/collections';
  const data={'@context':'https://schema.org','@graph':[
    {'@type':'CollectionPage','@id':url,url,name:'Product collections',description:metadata.description,mainEntity:{'@id':url+'#collections'}},
    {'@type':'ItemList','@id':url+'#collections',numberOfItems:items.length,itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.title,url:origin()+`/collections/${item.slug}`}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin()+'/'},{'@type':'ListItem',position:2,name:'Collections',item:url}]}
  ]};
  return <main id="main" className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(data)}}/>
    <section className={`${styles.wrap} ${styles.hero}`} aria-labelledby="collections-heading">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Collections</span></nav>
      <div className={styles.heroGrid}><div><span className={styles.eyebrow}>The product library</span><h1 id="collections-heading">Better sourcing.<br/><em>A clearer starting point.</em></h1></div><div className={styles.heroIntro}><p>Explore the products that belong together. Browse by market, compare product families, and go deeper with practical sourcing knowledge.</p><a href="/products">Know your product? Browse the directory <ArrowRight size={18} aria-hidden="true"/></a></div></div>
    </section>
    <CollectionDirectory items={items}/>
    <section className={`${styles.wrap} ${styles.cta}`}><div><span className={styles.eyebrow}>From discovery to delivery</span><h2>Found your starting point?</h2><p>Share the product, quantity, and destination. We’ll help connect your requirements with a broker.</p></div><a href="/request" className="button dark">Start a sourcing request <ArrowRight size={18} aria-hidden="true"/></a></section>
  </main>;
}
