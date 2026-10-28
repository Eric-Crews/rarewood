CREATE TABLE `supplier_products` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`product_slug` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `supply_partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_slug`) REFERENCES `products`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_supplier_products_partner` ON `supplier_products` (`partner_id`);--> statement-breakpoint
CREATE INDEX `idx_supplier_products_product` ON `supplier_products` (`product_slug`);--> statement-breakpoint
ALTER TABLE `supply_partners` ADD `shipping_availability` text DEFAULT '[]' NOT NULL;