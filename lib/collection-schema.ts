import type {Product,Post} from './types';
export function collectionStructuredData(h:Post,items:Product[],base:string){
 const url=`${base}/collections/${h.slug}`;
 return {'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage','@id':url,url,name:h.title,description:h.content.seoDescription,mainEntity:{'@id':`${url}#products`}},
  {'@type':'ItemList','@id':`${url}#products`,numberOfItems:items.length,itemListElement:items.map((i,index)=>({'@type':'ListItem',position:index+1,name:i.name,url:`${base}/products/${i.slug}`}))},
  ...(h.content.faqs.length?[{'@type':'FAQPage','@id':`${url}#faq`,mainEntity:h.content.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}]:[])
 ]};
}
