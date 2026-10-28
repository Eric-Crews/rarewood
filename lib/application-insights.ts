const ignoredWords = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'or', 'the', 'to', 'with']);

function words(value: string) {
 return value
  .replace(/\([^)]*\)/g, ' ')
  .replace(/&/g, ' and ')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()
  .split(/\s+/)
  .filter(word => word && !ignoredWords.has(word));
}

function sameWord(a: string, b: string) {
 if (a === b) return true;
 const stem = (word: string) => {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ing') && word.length > 6) {
   const root = word.slice(0, -3);
   return root.length > 2 && root.at(-1) === root.at(-2) ? root.slice(0, -1) : root;
  }
  return word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word;
 };
 return stem(a) === stem(b);
}

/** Match a planned Insight to an application card despite harmless punctuation and plural differences. */
export function applicationInsightMatches(topic: {title: string; brief: string}, applicationTitle: string) {
 const required = words(applicationTitle);
 const available = words(`${topic.title} ${topic.brief}`);
 return required.length > 0 && required.every(term => available.some(word => sameWord(term, word)));
}
