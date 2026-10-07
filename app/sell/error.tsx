'use client';
export default function SellError({reset}:{reset:()=>void}){return <main id="main" className="section empty-page"><h1>The supplier directory is temporarily unavailable.</h1><p>Please try again to load the current product list.</p><button className="button dark" onClick={reset}>Try again</button></main>;}
