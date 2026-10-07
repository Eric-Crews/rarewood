import type {Metadata} from 'next';
import {Header,Footer} from '@/components/site/header';
import {SiteAtmosphere} from '@/components/site/site-atmosphere';
import {origin} from '@/lib/db';
import './globals.css';
export async function generateMetadata():Promise<Metadata>{return {title:{default:'Rarewood Exchange | Specialty Lumber & Exotic Woods',template:'%s | Rarewood Exchange'},description:'Independent specialty lumber sourcing. Explore exotic hardwoods, slabs, decking, flooring and panels, then request pricing for your project.',metadataBase:new URL(origin()),openGraph:{title:'Rarewood Exchange | Specialty Lumber & Exotic Woods',description:'Exceptional wood. The right connections.',type:'website'},icons:{icon:'/favicon.svg'}};}
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><head/><body><a className="skip-link" href="#main">Skip to content</a><Header/><SiteAtmosphere>{children}</SiteAtmosphere><Footer/></body></html>;
}
