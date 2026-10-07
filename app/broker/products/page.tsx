import type {Metadata} from 'next';
import {BrokerProductReview} from '@/components/site/broker-product-review';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Private product review',description:'Broker product availability review.',robots:{index:false,follow:false,nocache:true},referrer:'no-referrer'};
export default function BrokerReviewPage(){return <BrokerProductReview/>;}
