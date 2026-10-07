import {listProducts,listHubs} from '@/lib/db';
import {ProductDirectory} from '@/components/site/product-directory';
import {directoryProduct} from '@/lib/product-directory';
import {SourcingCTA} from '@/components/site/editorial';
import styles from './directory.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'Specialty Wood & Lumber',description:'Explore exotic hardwood lumber, decking, flooring, slabs and plywood. Request pricing for your dimensions, quantity and destination.',alternates:{canonical:'/products'}};
export default async function Products(){
  const [products,hubs]=await Promise.all([listProducts(),listHubs()]);
  const categories=hubs.filter(h=>h.content.pageType==='category'&&h.content.categoryScope?.category).map(h=>({slug:h.slug,market:h.content.categoryScope!.market,category:h.content.categoryScope!.category!}));
  return <main id="main" className={styles.page}><ProductDirectory items={products.map(directoryProduct)} hubs={categories}/><SourcingCTA/></main>;
}
