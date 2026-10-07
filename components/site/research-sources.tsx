import type {Research} from '@/lib/research';
export function SourcedText({text,research}:{text:string;research?:Research}){
 if(!research)return <>{text}</>;
 return <>{text.split(/(\[\d+\])/g).map((part,index)=>{const match=/^\[(\d+)\]$/.exec(part);const source=match&&research.sources.find(s=>s.id===Number(match[1]));return source?<sup key={index}><a href={source.url} target="_blank" rel="noopener noreferrer" title={source.title} aria-label={`Source ${source.id}: ${source.title}`}>{part}</a></sup>:part;})}</>;
}
