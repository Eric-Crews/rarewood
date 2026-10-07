'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="section empty-page"><h1>This page is temporarily unavailable.</h1><p>Please try loading it again in a moment.</p><button className="button dark" onClick={reset}>Try again</button></main>}
