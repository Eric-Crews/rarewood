import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(), category: text('category').notNull(), summary: text('summary').notNull(), content: text('content').notNull(), image: text('image').notNull().default(''), imageCredit: text('image_credit').notNull().default(''), status: text('status').notNull().default('draft'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('idx_products_status_category').on(t.status,t.category)]);
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(), category: text('category').notNull(), summary: text('summary').notNull(), content: text('content').notNull(), image: text('image').notNull().default(''), imageCredit: text('image_credit').notNull().default(''), status: text('status').notNull().default('draft'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('idx_posts_status_updated').on(t.status,t.updatedAt)]);
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(), requestKey: text('request_key').notNull().unique(), reference: text('reference').notNull().unique(), company: text('company').notNull(), email: text('email').notNull(), product: text('product').notNull(), payload: text('payload').notNull(), status: text('status').notNull().default('new'), broker: text('broker').notNull().default(''), notes: text('notes').notNull().default(''), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('idx_leads_status_created').on(t.status,t.createdAt),index('idx_leads_email_created').on(t.email,t.createdAt)]);
export const media = sqliteTable('media', { id: text('id').primaryKey(), key: text('key').notNull().unique(), filename: text('filename').notNull(), contentType: text('content_type').notNull(), createdAt: text('created_at').notNull() });

export const supplierLeads = sqliteTable('supplier_leads', {
  id:text('id').primaryKey(), requestKey:text('request_key').notNull().unique(), reference:text('reference').notNull().unique(),
  productId:text('product_id').notNull(), productSlug:text('product_slug').notNull(), productName:text('product_name').notNull(),
  quantity:real('quantity').notNull(), unit:text('unit').notNull(), location:text('location').notNull(), phone:text('phone').notNull(),
  name:text('name').notNull().default(''), company:text('company').notNull().default(''), email:text('email').notNull().default(''),
  availability:text('availability').notNull(), details:text('details').notNull().default(''), consentAt:text('consent_at').notNull(),
  ipHash:text('ip_hash').notNull().default(''), status:text('status').notNull().default('new'), broker:text('broker').notNull().default(''), notes:text('notes').notNull().default(''),
  createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(), confirmedAt:text('confirmed_at').notNull(), reviewDueAt:text('review_due_at').notNull(),
},t=>[index('idx_supplier_created').on(t.createdAt),index('idx_supplier_phone_created').on(t.phone,t.createdAt),index('idx_supplier_ip_created').on(t.ipHash,t.createdAt)]);

export const adminLoginAttempts = sqliteTable('admin_login_attempts', {
  userId: text('user_id').primaryKey(), windowStart: integer('window_start').notNull(), attempts: integer('attempts').notNull(),
});

export const adminSettings = sqliteTable('admin_settings', {
  key:text('key').primaryKey(), value:text('value').notNull(), updatedAt:text('updated_at').notNull(),
});
export const brokerMail = sqliteTable('broker_mail', {
  leadKey:text('lead_key').primaryKey(), attemptId:text('attempt_id').notNull(), leadKind:text('lead_kind').notNull(), leadId:text('lead_id').notNull(),
  leadUpdatedAt:text('lead_updated_at').notNull(), reference:text('reference').notNull(), recipient:text('recipient').notNull(), sender:text('sender').notNull(),
  subject:text('subject').notNull(), body:text('body').notNull(), includeNotes:integer('include_notes').notNull().default(0), attachmentName:text('attachment_name').notNull(),
  status:text('status').notNull(), gmailMessageId:text('gmail_message_id').notNull().default(''), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
});

export const brokerReviewAccess = sqliteTable('broker_review_access', {
  id:text('id').primaryKey(), tokenHash:text('token_hash').notNull(), reviewer:text('reviewer').notNull(),
  createdAt:text('created_at').notNull(), expiresAt:text('expires_at').notNull(), revokedAt:text('revoked_at'),
});
export const brokerProductReviews = sqliteTable('broker_product_reviews', {
  productId:text('product_id').primaryKey(), answer:text('answer').notNull(), reviewer:text('reviewer').notNull(),
  answeredAt:text('answered_at').notNull(), revision:integer('revision').notNull(), actionId:text('action_id').notNull(),
});

// Rarewood owns an independent schema; no production Bulk Ag records are imported.
export const woodSpecies=sqliteTable('wood_species',{slug:text('slug').primaryKey(),name:text('name').notNull(),aliases:text('aliases').notNull(),summary:text('summary').notNull(),status:text('status').notNull().default('draft'),updatedAt:text('updated_at').notNull()});
export const supplyPartners=sqliteTable('supply_partners',{id:text('id').primaryKey(),name:text('name').notNull(),contact:text('contact').notNull().default(''),email:text('email').notNull().default(''),phone:text('phone').notNull().default(''),location:text('location').notNull().default(''),notes:text('notes').notNull().default(''),active:integer('active').notNull().default(1),updatedAt:text('updated_at').notNull()});
export const inventoryLots=sqliteTable('inventory_lots',{id:text('id').primaryKey(),productSlug:text('product_slug').notNull().references(()=>products.slug),partnerId:text('partner_id').notNull().references(()=>supplyPartners.id),reference:text('reference').notNull(),quantity:real('quantity'),unit:text('unit').notNull(),dimensions:text('dimensions').notNull().default(''),condition:text('condition').notNull().default(''),location:text('location').notNull().default(''),status:text('status').notNull().default('unconfirmed'),confirmedAt:text('confirmed_at'),notes:text('notes').notNull().default(''),updatedAt:text('updated_at').notNull()},t=>[index('idx_lots_product_status').on(t.productSlug,t.status)]);
export const sourcingDeals=sqliteTable('sourcing_deals',{leadId:text('lead_id').primaryKey().references(()=>leads.id),partnerId:text('partner_id').references(()=>supplyPartners.id),stage:text('stage').notNull().default('new'),materialAmount:real('material_amount'),freightAmount:real('freight_amount'),commissionAmount:real('commission_amount'),commissionPaidAt:text('commission_paid_at'),quoteExpires:text('quote_expires').notNull().default(''),invoiceReference:text('invoice_reference').notNull().default(''),shipmentReference:text('shipment_reference').notNull().default(''),trackingUrl:text('tracking_url').notNull().default(''),notes:text('notes').notNull().default(''),updatedAt:text('updated_at').notNull()},t=>[index('idx_deals_stage').on(t.stage)]);
