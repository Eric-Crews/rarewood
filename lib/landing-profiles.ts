export type LandingProfile={
  displayName:string;
  badges:string[];
  facts:{value:string;label:string}[];
  highlights:string[];
  overview:string[];
  benefits:{title:string;text:string}[];
  specifications:{caption:string;columns:string[];rows:string[][];note:string};
  applications:{title:string;text:string}[];
  shipping:{title:string;text:string}[];
  related:string[];
  faqs:{question:string;answer:string}[];
};

import products from '@/data/wood-products.json';
export const landingProfiles:Record<string,LandingProfile>=Object.fromEntries(products.map(p=>[p.slug,p.content.landingProfile]));
