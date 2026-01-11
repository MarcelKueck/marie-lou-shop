CREATE TABLE `gift_card_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_card_id` text NOT NULL,
	`order_id` text,
	`amount` integer NOT NULL,
	`balance_before` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`type` text DEFAULT 'redemption' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gift_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`initial_amount` integer NOT NULL,
	`current_balance` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`purchased_by_email` text NOT NULL,
	`purchased_by_customer_id` text,
	`order_id` text,
	`recipient_email` text,
	`recipient_name` text,
	`personal_message` text,
	`delivery_method` text DEFAULT 'email' NOT NULL,
	`sent_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`purchased_by_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_code_unique` ON `gift_cards` (`code`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name_en` text NOT NULL,
	`name_de` text NOT NULL,
	`price_modifier` integer DEFAULT 0 NOT NULL,
	`sku` text,
	`stock_quantity` integer,
	`sort_order` integer DEFAULT 0,
	`active` integer DEFAULT true NOT NULL,
	`weight` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`name_en` text NOT NULL,
	`name_de` text NOT NULL,
	`origin_en` text,
	`origin_de` text,
	`notes_en` text,
	`notes_de` text,
	`description_en` text,
	`description_de` text,
	`base_price` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`stock_quantity` integer DEFAULT 0,
	`low_stock_threshold` integer DEFAULT 10,
	`track_inventory` integer DEFAULT true,
	`image` text,
	`badge` text,
	`sort_order` integer DEFAULT 0,
	`attributes` text,
	`average_rating` real DEFAULT 0,
	`review_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`rating` integer NOT NULL,
	`title` text,
	`content` text,
	`customer_name` text NOT NULL,
	`verified_purchase` integer DEFAULT false,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_response` text,
	`admin_responded_at` integer,
	`created_at` integer NOT NULL,
	`approved_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscription_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`order_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_for` integer NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`stripe_subscription_id` text,
	`stripe_price_id` text,
	`stripe_customer_id` text,
	`product_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`product_name` text NOT NULL,
	`variant_name` text NOT NULL,
	`interval_count` integer DEFAULT 4 NOT NULL,
	`interval_unit` text DEFAULT 'week' NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`shipping_first_name` text NOT NULL,
	`shipping_last_name` text NOT NULL,
	`shipping_line1` text NOT NULL,
	`shipping_line2` text,
	`shipping_city` text NOT NULL,
	`shipping_postal_code` text NOT NULL,
	`shipping_country` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`next_delivery_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`cancelled_at` integer,
	`paused_at` integer,
	`pause_until` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_subscription_id_unique` ON `subscriptions` (`stripe_subscription_id`);