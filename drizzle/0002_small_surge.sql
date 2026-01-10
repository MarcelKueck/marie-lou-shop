CREATE TABLE `refund_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`reason` text NOT NULL,
	`reason_details` text,
	`requested_amount` integer NOT NULL,
	`approved_amount` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`processed_by` text,
	`stripe_refund_id` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	`processed_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_number` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_generated_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_id_unique` ON `orders` (`stripe_session_id`);