ALTER TABLE `customers` ADD `referral_trusted` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `referral_suspended` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `customers` ADD `referral_notes` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `review_request_sent_at` integer;