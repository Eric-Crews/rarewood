export type ReviewAnswer='yes'|'no';
export type BrokerReviewItem={id:string;name:string;slug:string;category:string;aliases:string[];needsClarification:boolean;catalogState:'future'|'draft'|'published';updatedAt:string;answer:ReviewAnswer|null;reviewer:string|null;answeredAt:string|null;revision:number};
export type BrokerReviewData={items:BrokerReviewItem[];reviewer:string};
export type BrokerReviewAccessInfo={active:boolean;reviewer:string;expiresAt:string|null};
