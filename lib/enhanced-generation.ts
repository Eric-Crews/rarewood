import {generateContent} from './generation';
// The model supplies the wood product content; React owns layout and styling.
export async function generateEnhanced(input:Parameters<typeof generateContent>[0]){
 return generateContent({...input,kind:'product'});
}
