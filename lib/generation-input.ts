export type GenerationInput={kind:string;name:string;summary:string;category:string;sourceNotes:string;related:{slug:string;name:string}[];existingTopics?:string[];slug?:string;availableHubs?:{slug:string;title:string}[];existingMetadata?:{tags?:string[];topics?:string[];aliases?:string[];hubSlugs?:string[];parentHub?:string}};

// The editor record can carry old copy and imported catalog provenance. Never
// serialize it wholesale into an AI request. Product facts start with identity.
export function editorialRequest(input:GenerationInput):GenerationInput{
 if(input.kind==='product')return {kind:'product',name:input.name,slug:input.slug,summary:'',category:input.category,sourceNotes:'',related:input.related,availableHubs:input.availableHubs,existingMetadata:input.existingMetadata,existingTopics:input.existingTopics};
 return {kind:input.kind,name:input.name,slug:input.slug,summary:input.summary,category:input.category,sourceNotes:input.sourceNotes,related:input.related,existingTopics:input.existingTopics,availableHubs:input.availableHubs,existingMetadata:input.existingMetadata};
}
