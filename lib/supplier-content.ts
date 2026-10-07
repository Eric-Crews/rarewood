import type {Product} from './types';
import {isStartingProduct} from './catalog-availability';

export type SellProduct={id:string;slug:string;name:string;category:string;aliases:string[];buyerPublished:boolean;};
export function canSellProduct(item:Product){return isStartingProduct(item)&&!item.content.needsClarification;}
export function sellProduct(item:Product):SellProduct{return {id:item.id,slug:item.slug,name:item.name,category:item.category,aliases:item.content.aliases||[],buyerPublished:item.status==='published'};}

export function supplierProfile(item:SellProduct){return {label:item.category,intro:'Describe the actual wood lot so a buyer can assess its suitability before requesting a quote.',details:['Identify the species or verified trade name, product form, dimensions, and surface preparation.','Record the measured moisture condition, grade or appearance selection, length distribution, and available documentation.','State the quantity and unit, inventory location, loading access, and earliest collection date.']};}
export function supplierFaqs(item:SellProduct){const name=item.name;return [
 {question:`Is it free to list ${name.toLowerCase()} with Rarewood Exchange?`,answer:'Yes. Rarewood Exchange charges no fee to submit your available inventory for broker review. Any brokerage compensation, freight charges, or other transaction costs must be discussed and agreed separately before a deal.'},
 {question:`What should I include when selling ${name.toLowerCase()}?`,answer:`Start with your quantity and unit, the inventory location, and a phone number. Add the exact form or grade, available date, packaging, and any lot specifications you can substantiate. ${supplierProfile(item).details[0]}`},
 {question:'Does submitting inventory guarantee a buyer or a price?',answer:'No. A submission gives our team and a relevant broker an opportunity to assess the lot and potential buyer fit. A sale, response time, market price, and delivery arrangement are not guaranteed. All terms depend on agreement between the parties.'},
 {question:'Will my phone number or inventory be published automatically?',answer:'No. This form creates a private supplier record for review and broker follow-up. Your contact details and inventory are not automatically published as a public listing.'},
 {question:'What happens if my available quantity changes?',answer:'Tell the broker handling your inquiry and include your submission reference. Our team can update the inquiry and reconfirm availability. Inventory that has not been reconfirmed within seven days is flagged for review.'},
 ];}
