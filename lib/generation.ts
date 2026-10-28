import {editorialRequest,type GenerationInput} from './generation-input';
import {withoutCitationMarkers} from './public-content';
import {hubEditorialBrief} from './hub-generation';
import {sharedEditorialBrief,productEditorialBrief} from './buyer-editorial';
import {insightEditorialBrief} from './insight-editorial';
import {runtime} from './db';
import {contentSchema,blogTopicsSchema} from './validation';
import catalogTaxonomy from '../data/catalog-taxonomy.json';
import {productGenerationSchema,articleGenerationSchema,hubGenerationSchema,structuredSchema} from './generation-contract';

export const OPENAI_CONTENT_MODEL='gpt-5-mini';

function instructionsFor(input:GenerationInput){
 const specific=input.kind==='product'?productEditorialBrief:input.kind==='hub'?hubEditorialBrief:insightEditorialBrief;
 const seoTerms=Object.values(catalogTaxonomy.seoModifiers).flat().join(', ');
 return `${sharedEditorialBrief}\n\n${specific}\n\nRelevant catalog search terms (use only if natural): ${seoTerms}`;
}

export async function generateContent(input:GenerationInput){
 const validator=input.kind==='product'?productGenerationSchema:input.kind==='hub'?hubGenerationSchema:articleGenerationSchema;
 const outputSchema=structuredSchema(validator);
 const config=runtime();
 if(!config.OPENAI_API_KEY)throw new Error('OpenAI is not connected. Add OPENAI_API_KEY as a site secret to enable generation. You can still write and publish content manually.');
 const request=editorialRequest(input);
 let checked=validator.safeParse(null),validationIssues:string[]=[];
 for(let attempt=0;attempt<2;attempt++){
  const repair=validationIssues.length?`\n\nVALIDATION REPAIR: Your previous draft failed these exact requirements:\n- ${validationIssues.join('\n- ')}\nRevise the complete JSON to satisfy every requirement. Preserve useful valid material, and return the complete object.`:'';
  const response=await fetch('https://api.openai.com/v1/responses',{
   method:'POST',
   headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.OPENAI_API_KEY}`},
   signal:AbortSignal.timeout(90000),
   body:JSON.stringify({
    model:OPENAI_CONTENT_MODEL,
    store:false,
    max_output_tokens:14000,
    instructions:instructionsFor(input)+repair,
    // No tools are declared: page drafting cannot invoke web search or retrieval.
    input:JSON.stringify({pageType:input.kind,request}),
    text:{format:{type:'json_schema',name:'rarewood_page_content',strict:true,schema:outputSchema}}
   })
  });
  if(!response.ok)throw new Error(`OpenAI could not generate this draft (${response.status}). Check the connection and account limits.`);
  const result=await response.json() as {status?:string;output?:{type?:string;content?:{type:string;text?:string;refusal?:string}[]}[]};
  if(result.status==='incomplete')throw new Error('The draft was incomplete. Please retry with a shorter brief.');
  const output=result.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
  if(!output)throw new Error('The model did not return a usable draft. Please review the brief and retry.');
  let decoded:unknown;
  try{decoded=JSON.parse(output);}catch{throw new Error('The AI returned unreadable JSON. No changes were saved. Please generate again.');}
  checked=validator.safeParse(withoutCitationMarkers(decoded));
  if(checked.success)break;
  validationIssues=checked.error.issues.slice(0,8).map(i=>`${i.path.join('.')}: ${i.message}`);
 }
 if(!checked.success)throw new Error(`The AI draft failed validation after one automatic repair attempt: ${validationIssues.slice(0,3).join('; ')}. No changes were saved. Please generate again.`);
 const {parentHub,...validated}=checked.data;
 const allowedHubs=new Set((input.availableHubs||[]).map(h=>h.slug));
 const parsed=contentSchema.parse({...validated,parentHub:allowedHubs.has(parentHub)?parentHub:undefined,hubSlugs:validated.hubSlugs.filter(s=>allowedHubs.has(s))});
 if(parsed.landingProfile){
  const spec=parsed.landingProfile.specifications;
  if(spec.rows.some(row=>row.length!==spec.columns.length))throw new Error('The AI specification table has mismatched columns. No changes were saved. Please generate again.');
 }
 if(input.kind==='product'){
  parsed.blogTopics=blogTopicsSchema.parse(parsed.blogTopics);
  const existing=new Set((input.existingTopics||[]).map(t=>t.trim().toLowerCase()));
  if(parsed.blogTopics.some(t=>existing.has(t.title.trim().toLowerCase())))throw new Error('A proposed topic duplicates an existing Insight. Please generate a fresh topic set.');
 }
 const allowed=new Set(input.related.map(r=>r.slug));
 parsed.relatedProducts=input.kind==='product'?[...allowed].slice(0,12):parsed.relatedProducts.filter(s=>allowed.has(s));
 if(input.kind==='product'){
  parsed.hubSlugs=(input.existingMetadata?.hubSlugs||[]).filter(s=>allowedHubs.has(s));
  const parent=input.existingMetadata?.parentHub;
  parsed.parentHub=parent&&allowedHubs.has(parent)?parent:undefined;
 }
 if(parsed.landingProfile){parsed.landingProfile.related=parsed.relatedProducts;parsed.landingProfile.faqs=parsed.faqs;}
 parsed.sourceNotes=request.sourceNotes;
 return {...parsed,slug:input.slug||checked.data.slug,category:checked.data.category,summary:checked.data.summary,generatedAt:new Date().toISOString()};
}
