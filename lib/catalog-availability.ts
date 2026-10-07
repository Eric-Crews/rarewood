import catalog from '../data/imported-catalog.json';
import type {Product} from './types';
const original=new Map(catalog.map(item=>[item.slug,item.sourceStatus]));
export function isStartingProduct(item:Pick<Product,'id'|'slug'|'content'>){
 const status=original.get(item.id.replace(/^catalog-/,''))||original.get(item.slug)||item.content.sourceStatus;
 return status==='current'||(item.content.brokerAvailabilityConfirmed===true&&!!item.content.brokerAvailabilityNote?.trim());
}
