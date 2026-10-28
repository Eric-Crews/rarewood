import type {Metadata} from 'next';
import {Header,Footer} from '@/components/site/header';
import {SiteAtmosphere} from '@/components/site/site-atmosphere';
import {origin} from '@/lib/db';
import './globals.css';
export async function generateMetadata():Promise<Metadata>{return {title:{default:'Natural Stone Exchange | Wholesale Natural Stone Sourcing',template:'%s | Natural Stone Exchange'},description:'Independent wholesale natural stone sourcing. Explore marble, quartzite, granite, limestone, travertine, paving and architectural stone; request supplier quotations.',metadataBase:new URL(origin()),openGraph:{title:'Natural Stone Exchange | Wholesale Natural Stone Sourcing',description:'Natural stone. The right connections.',type:'website'},icons:{icon:'/favicon.svg'}};}
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><head/><body><a className="skip-link" href="#main">Skip to content</a><Header/><SiteAtmosphere>{children}</SiteAtmosphere><Footer/></body></html>;
}
