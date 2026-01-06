CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`company` text,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`state` text,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`subject` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`stripe_customer_id` text,
	`marketing_opt_in` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `newsletters` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`brand` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`subscribed_at` integer NOT NULL,
	`unsubscribed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletters_email_unique` ON `newsletters` (`email`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`product_name` text NOT NULL,
	`variant_name` text NOT NULL,
	`product_slug` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	`weight` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` text,
	`brand` text NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipping_first_name` text NOT NULL,
	`shipping_last_name` text NOT NULL,
	`shipping_company` text,
	`shipping_line1` text NOT NULL,
	`shipping_line2` text,
	`shipping_city` text NOT NULL,
	`shipping_state` text,
	`shipping_postal_code` text NOT NULL,
	`shipping_country` text NOT NULL,
	`billing_first_name` text,
	`billing_last_name` text,
	`billing_company` text,
	`billing_line1` text,
	`billing_line2` text,
	`billing_city` text,
	`billing_state` text,
	`billing_postal_code` text,
	`billing_country` text,
	`shipping_method` text NOT NULL,
	`shipping_cost` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`stripe_payment_intent_id` text,
	`stripe_session_id` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`roasted_at` integer,
	`shipped_at` integer,
	`delivered_at` integer,
	`tracking_number` text,
	`tracking_url` text,
	`customer_notes` text,
	`internal_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);