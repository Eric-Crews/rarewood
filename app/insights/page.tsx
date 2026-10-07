import {Wheat, BookOpen} from 'lucide-react';
import {notFound} from 'next/navigation';
import {listPosts} from '@/lib/db';
import {journalEntry,parseJournalQuery,paginateJournal,journalMetadata,type JournalSearchParams} from '@/lib/journal';
import {JournalBrowser} from '@/components/site/journal-browser';
import styles from './journal.module.css';
export const dynamic='force-dynamic';
type Props={searchParams:Promise<JournalSearchParams>};
export async function generateMetadata({searchParams}:Props){return journalMetadata(parseJournalQuery(await searchParams));}
export default async function Journal({searchParams}:Props){
  const parsed=parseJournalQuery(await searchParams);
  const query={...parsed,mix:parsed.mix||crypto.randomUUID().replace(/-/g,'').slice(0,16)};
  const entries=(await listPosts()).filter(post=>post.content.generationState!=='planned').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id)).map(journalEntry);
  const result=paginateJournal(entries,query);
  if(result.outOfRange)notFound();
  const categories=['All',...Array.from(new Set(entries.map(entry=>entry.category))).sort()];
  return <main id="main" className={styles.page}>
    <section className={styles.hero} aria-labelledby="journal-heading">
      <div className={styles.heroScene}>
        <img src="/images/wood/workshop.webp" srcSet="/images/wood/workshop-small.webp 640w, /images/wood/workshop.webp 1536w" sizes="(max-width: 700px) 100vw, 65vw" width={1672} height={941} alt="A notebook and pen beside a field at sunset" fetchPriority="high"/>
      </div>
      <Wheat className={styles.watermark} aria-hidden="true" strokeWidth={1}/>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>The sourcing journal</span>
          <h1 id="journal-heading">Better informed.<br/><span>Better prepared.</span></h1>
          <p>Practical guides to products, specifications, and the questions worth asking before you buy.</p>
        </div>
        <p className={styles.sceneCaption}>Better products.<br/>Better questions.<br/>Stronger connections.</p>
      </div>
    </section>
    <JournalBrowser result={result} query={query} categories={categories} totalEntries={entries.length}/>
    <section className={styles.sourcingBand} aria-labelledby="sourcing-heading">
      <span className={styles.bandIcon}><BookOpen size={28} strokeWidth={1.4} aria-hidden="true"/></span>
      <div className={styles.bandCopy}>
        <span className={styles.eyebrow}>Put your knowledge to work</span>
        <h2 id="sourcing-heading">A better starting point for your next order.</h2>
        <p>Explore product specifications or share your volume, delivery needs, and buying requirements.</p>
      </div>
      <div className={styles.bandActions}>
        <a href="/request" className={styles.quoteButton}>Request a quote</a>
        <a href="/products" className={styles.directoryLink}>Explore products</a>
      </div>
    </section>
  </main>;
}
