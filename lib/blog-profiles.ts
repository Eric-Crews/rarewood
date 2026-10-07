export type BuyerGuideProfile={
  title:string;description:string;category:string;readTime:string;updated:string;
  takeaways:string[];intro:string[];
  formatPath:{name:string;stage:string;dryMatter:number;range:string;fit:string;focus?:boolean}[];
  comparison:{columns:string[];rows:string[][]};
  faqs:{question:string;answer:string}[];
};

export const buyerGuideProfiles:Record<string,BuyerGuideProfile>={};
