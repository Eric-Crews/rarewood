CREATE TABLE `admin_login_attempts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`attempts` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `broker_mail` (
	`lead_key` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`lead_kind` text NOT NULL,
	`lead_id` text NOT NULL,
	`lead_updated_at` text NOT NULL,
	`reference` text NOT NULL,
	`recipient` text NOT NULL,
	`sender` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`include_notes` integer DEFAULT 0 NOT NULL,
	`attachment_name` text NOT NULL,
	`status` text NOT NULL,
	`gmail_message_id` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `broker_product_reviews` (
	`product_id` text PRIMARY KEY NOT NULL,
	`answer` text NOT NULL,
	`reviewer` text NOT NULL,
	`answered_at` text NOT NULL,
	`revision` integer NOT NULL,
	`action_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `broker_review_access` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`reviewer` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text
);
--> statement-breakpoint
CREATE TABLE `inventory_lots` (
	`id` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL,
	`partner_id` text NOT NULL,
	`reference` text NOT NULL,
	`quantity` real,
	`unit` text NOT NULL,
	`dimensions` text DEFAULT '' NOT NULL,
	`condition` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'unconfirmed' NOT NULL,
	`confirmed_at` text,
	`notes` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_slug`) REFERENCES `products`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `supply_partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lots_product_status` ON `inventory_lots` (`product_slug`,`status`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`reference` text NOT NULL,
	`company` text NOT NULL,
	`email` text NOT NULL,
	`product` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`broker` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_request_key_unique` ON `leads` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_reference_unique` ON `leads` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_leads_status_created` ON `leads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_leads_email_created` ON `leads` (`email`,`created_at`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_key_unique` ON `media` (`key`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`image_credit` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_posts_status_updated` ON `posts` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`image_credit` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_status_category` ON `products` (`status`,`category`);--> statement-breakpoint
CREATE TABLE `sourcing_deals` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`partner_id` text,
	`stage` text DEFAULT 'new' NOT NULL,
	`material_amount` real,
	`freight_amount` real,
	`commission_amount` real,
	`commission_paid_at` text,
	`quote_expires` text DEFAULT '' NOT NULL,
	`invoice_reference` text DEFAULT '' NOT NULL,
	`shipment_reference` text DEFAULT '' NOT NULL,
	`tracking_url` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `supply_partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_deals_stage` ON `sourcing_deals` (`stage`);--> statement-breakpoint
CREATE TABLE `supplier_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`reference` text NOT NULL,
	`product_id` text NOT NULL,
	`product_slug` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`location` text NOT NULL,
	`phone` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`availability` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`consent_at` text NOT NULL,
	`ip_hash` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`broker` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`confirmed_at` text NOT NULL,
	`review_due_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supplier_leads_request_key_unique` ON `supplier_leads` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `supplier_leads_reference_unique` ON `supplier_leads` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_supplier_created` ON `supplier_leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_supplier_phone_created` ON `supplier_leads` (`phone`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_supplier_ip_created` ON `supplier_leads` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `supply_partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wood_species` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aliases` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text NOT NULL
);
