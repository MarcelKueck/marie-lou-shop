CREATE TABLE `referral_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`code` text NOT NULL,
	`times_used` integer DEFAULT 0 NOT NULL,
	`total_rewards_earned` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_codes_code_unique` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE TABLE `referral_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`referral_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`product_slug` text NOT NULL,
	`variant_id` text NOT NULL,
	`variant_name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`claimed_order_id` text,
	`shipped_separately` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`claimed_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claimed_order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_code_id` text NOT NULL,
	`referrer_id` text NOT NULL,
	`referred_id` text,
	`referred_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`qualifying_order_id` text,
	`reward_id` text,
	`created_at` integer NOT NULL,
	`qualified_at` integer,
	`rewarded_at` integer,
	`revoked_at` integer,
	`revoke_reason` text,
	FOREIGN KEY (`referrer_code_id`) REFERENCES `referral_codes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referrer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`qualifying_order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reward_id`) REFERENCES `referral_rewards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `referral_code_used` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `referral_discount` integer DEFAULT 0;