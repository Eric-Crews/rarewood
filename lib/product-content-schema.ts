/**
 * Source-of-record shape for product guide records. Broker supplied and
 * human verified data must remain authoritative; AI output is a draft layer.
 */
export type ProductRecord = {
  schemaVersion: "1.0";
  status: "draft" | "review" | "published";
  verified: boolean;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  overview: string;
  formsAndGrades: Array<{ name: string; details: string; verified: boolean }>;
  commonApplications: Array<{ name: string; details: string; verified: boolean }>;
  sourcingConsiderations: string[];
  buyerQuestions: string[];
  relatedProducts: string[];
  faqs: Array<{ question: string; answer: string; verified: boolean }>;
  seo: { title: string; description: string; canonicalPath: string };
  structuredData: { type: "Product" | "Article"; name: string; description: string };
  contentReview: { generatedAt?: string; reviewedAt?: string; reviewedBy?: string };
};

export const productRecordGuidance = {
  sourceOfTruth: "Broker and supplier records, followed by human review",
  aiRole: "Draft and structure descriptive copy; never invent availability, grades, specifications, prices, certifications, or supplier claims",
  publishRule: "Only publish after required commercial facts are verified",
} as const;
