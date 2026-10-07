import type {Content} from './types';

// Research belongs in the editor. Also handles drafts saved by the earlier
// generator, which put numbered research references into public fields.
export function withoutCitationMarkers<T>(value:T):T{
 if(typeof value==='string')return value.replace(/[ \t]*\[\d+(?:\s*[,;–-]\s*\d+)*\]/g,'').replace(/[ \t]+([,.!?;:])/g,'$1').trim() as T;
 if(Array.isArray(value))return value.map(item=>withoutCitationMarkers(item)) as T;
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,withoutCitationMarkers(item)])) as T;
 return value;
}
export function publicContent(content:Content):Content{
 const {research,sourceNotes,...editorial}=content;
 return {...(research?withoutCitationMarkers(editorial):editorial),sourceNotes:''};
}
