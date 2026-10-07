import {z} from 'zod';
import {contentSchema,landingSchema,blogTopicsSchema,slugSchema} from './validation';
import products from '../data/wood-products.json';

const editorialSchema=contentSchema.pick({seoTitle:true,seoDescription:true,sections:true,applications:true,buyingChecklist:true,faqs:true,relatedProducts:true,sourceNotes:true}).extend({summary:z.string().min(10).max(500),slug:slugSchema,category:z.string().min(2).max(80),tags:contentSchema.shape.tags.unwrap(),topics:contentSchema.shape.topics.unwrap(),aliases:contentSchema.shape.aliases.unwrap(),hubSlugs:contentSchema.shape.hubSlugs.unwrap(),parentHub:z.string().max(120)});
const heroFactsSchema=z.array(z.object({label:z.enum(['Product type','Primary use','Physical forms']),value:z.string().min(2).max(48)})).max(3);
export const productGenerationSchema=editorialSchema.extend({landingProfile:landingSchema.extend({facts:heroFactsSchema,shipping:landingSchema.shape.shipping.length(3)}),blogTopics:blogTopicsSchema});
export const articleGenerationSchema=editorialSchema;
export const hubGenerationSchema=editorialSchema.extend({sections:contentSchema.shape.sections.min(2).max(3),faqs:contentSchema.shape.faqs.min(3).max(5),applications:contentSchema.shape.applications.max(0),buyingChecklist:contentSchema.shape.buyingChecklist.max(0)});
// Share editor field limits, with stricter module counts for new AI drafts.
// Existing manually edited pages remain saveable with their original module counts.
export function structuredSchema(schema:z.ZodTypeAny):Record<string,unknown>{
 if(schema instanceof z.ZodEffects)return structuredSchema(schema.innerType());
 if(schema instanceof z.ZodObject){const properties=Object.fromEntries(Object.entries(schema.shape).map(([key,value])=>[key,structuredSchema(value as z.ZodTypeAny)]));return {type:'object',additionalProperties:false,properties,required:Object.keys(properties)};}
 if(schema instanceof z.ZodString){const result:Record<string,unknown>={type:'string'};for(const check of schema._def.checks){if(check.kind==='min')result.minLength=check.value;if(check.kind==='max')result.maxLength=check.value;if(check.kind==='regex')result.pattern=check.regex.source;}return result;}
 if(schema instanceof z.ZodArray){const d=schema._def;return {type:'array',items:structuredSchema(d.type),...(d.minLength?{minItems:d.minLength.value}:{}),...(d.maxLength?{maxItems:d.maxLength.value}:{}),...(d.exactLength?{minItems:d.exactLength.value,maxItems:d.exactLength.value}:{})};}
 if(schema instanceof z.ZodEnum)return {type:'string',enum:schema.options};
 throw new Error('Unsupported generation contract field');
}
const sample=products.find(product=>product.slug==='ipe-decking')!;
export const woodGenerationExample=productGenerationSchema.parse({
 ...sample.content,slug:sample.slug,summary:sample.summary,category:sample.category,
 tags:sample.content.tags||[],topics:sample.content.topics||[],aliases:sample.content.aliases||[],hubSlugs:[],parentHub:'',
 sourceNotes:''
});
