import {db} from './db';
export type LeadCounts={buyers:number;suppliers:number};
// Review/qualification still awaits handoff. Assigned or later stages are
// already handled, including leads handed to a broker outside the Gmail flow.
// Confirmed mail also clears the badge if a concurrent edit kept status=new.
export async function pendingLeadCounts():Promise<LeadCounts>{
 const result=await db().prepare(`SELECT
  (SELECT COUNT(*) FROM leads l WHERE l.status IN ('new','qualified')
   AND NOT EXISTS (SELECT 1 FROM broker_mail m WHERE m.lead_key='buyer:'||l.id AND m.status IN ('sent','confirmed'))) AS buyers,
  (SELECT COUNT(*) FROM supplier_leads l WHERE l.status IN ('new','reviewing')
   AND NOT EXISTS (SELECT 1 FROM broker_mail m WHERE m.lead_key='supplier:'||l.id AND m.status IN ('sent','confirmed'))) AS suppliers`).first<LeadCounts>();
 if(!result)throw new Error('Lead counts are unavailable.');
 return {buyers:Number(result.buyers),suppliers:Number(result.suppliers)};
}
