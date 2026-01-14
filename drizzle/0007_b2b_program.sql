CREATE TABLE `b2b_communication_log` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`subject` text,
	`content` text,
	`email_template` text,
	`email_status` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`vat_id` text,
	`industry` text,
	`contact_first_name` text NOT NULL,
	`contact_last_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text,
	`password_hash` text,
	`tier` text DEFAULT 'flex' NOT NULL,
	`employee_count` integer,
	`monthly_rate_per_employee` integer,
	`flex_discount_tier` text DEFAULT 'none',
	`status` text DEFAULT 'inquiry' NOT NULL,
	`promo_code` text,
	`promo_discount_percent` integer DEFAULT 10,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`payment_terms_days` integer DEFAULT 0,
	`billing_line1` text,
	`billing_line2` text,
	`billing_city` text,
	`billing_postal_code` text,
	`billing_country` text DEFAULT 'DE',
	`shipping_line1` text,
	`shipping_line2` text,
	`shipping_city` text,
	`shipping_postal_code` text,
	`shipping_country` text DEFAULT 'DE',
	`preferred_products` text,
	`preferred_brand` text DEFAULT 'coffee',
	`current_coffee_solution` text,
	`inquiry_message` text,
	`internal_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`approved_at` integer,
	`activated_at` integer,
	`paused_at` integer,
	`cancelled_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `b2b_companies_contact_email_unique` ON `b2b_companies` (`contact_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `b2b_companies_promo_code_unique` ON `b2b_companies` (`promo_code`);--> statement-breakpoint
CREATE TABLE `b2b_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`billing_period_start` integer NOT NULL,
	`billing_period_end` integer NOT NULL,
	`employee_count` integer NOT NULL,
	`rate_per_employee` integer NOT NULL,
	`base_amount` integer NOT NULL,
	`extra_shipments_amount` integer DEFAULT 0,
	`subtotal` integer NOT NULL,
	`tax_rate` real DEFAULT 0.19 NOT NULL,
	`tax_amount` integer NOT NULL,
	`total` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`external_invoice_id` text,
	`stripe_invoice_id` text,
	`stripe_payment_intent_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`due_at` integer,
	`paid_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `b2b_invoices_invoice_number_unique` ON `b2b_invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `b2b_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`order_id` text,
	`order_type` text DEFAULT 'flex' NOT NULL,
	`po_number` text,
	`payment_due_date` integer,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`volume_discount_percent` integer DEFAULT 0,
	`volume_discount_amount` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`reminder_sent_at` integer,
	`reminder2_sent_at` integer,
	`reminder3_sent_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_promo_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`promo_code` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`customer_email` text NOT NULL,
	`discount_percent` integer NOT NULL,
	`discount_amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`box_id` text,
	`trigger_type` text NOT NULL,
	`triggered_at` integer NOT NULL,
	`trigger_fill_percent` integer,
	`items` text NOT NULL,
	`total_weight_grams` integer NOT NULL,
	`tracking_number` text,
	`tracking_url` text,
	`carrier` text DEFAULT 'DHL',
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`shipped_at` integer,
	`delivered_at` integer,
	`cancelled_at` integer,
	`internal_notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_sustainability_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`total_coffee_kg` real DEFAULT 0,
	`total_tea_kg` real DEFAULT 0,
	`total_cups_served` integer DEFAULT 0,
	`farmer_premium_paid_cents` integer DEFAULT 0,
	`recyclable_packaging_count` integer DEFAULT 0,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `b2b_sustainability_stats_company_id_unique` ON `b2b_sustainability_stats` (`company_id`);--> statement-breakpoint
CREATE TABLE `b2b_waitlist_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`team_size` text NOT NULL,
	`current_solution` text NOT NULL,
	`interest_level` text NOT NULL,
	`preferred_start` text,
	`message` text,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text,
	`converted_to_company_id` text,
	`created_at` integer NOT NULL,
	`contacted_at` integer,
	`converted_at` integer,
	FOREIGN KEY (`converted_to_company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `box_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`box_id` text NOT NULL,
	`weight_grams` integer NOT NULL,
	`battery_percent` integer,
	`signal_strength` integer,
	`fill_percent` integer,
	`estimated_consumption_grams` integer,
	`firmware_version` text,
	`temperature` real,
	`recorded_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `smart_boxes` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`device_id` text NOT NULL,
	`mac_address` text,
	`firmware_version` text,
	`size` text DEFAULT 'medium' NOT NULL,
	`capacity_kg` real NOT NULL,
	`product_type` text DEFAULT 'coffee' NOT NULL,
	`current_product_id` text,
	`current_product_name` text,
	`reorder_threshold_percent` integer DEFAULT 20,
	`low_battery_threshold_percent` integer DEFAULT 20,
	`current_weight_grams` integer,
	`current_fill_percent` integer,
	`current_battery_percent` integer,
	`last_reading_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`location_description` text,
	`created_at` integer NOT NULL,
	`activated_at` integer,
	`last_online_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `smart_boxes_device_id_unique` ON `smart_boxes` (`device_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `b2b_promo_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `b2b_promo_discount` integer DEFAULT 0;