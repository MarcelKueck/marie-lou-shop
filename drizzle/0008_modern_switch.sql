CREATE TABLE `b2b_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`box_id` text,
	`type` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	`resolution_notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `b2b_holiday_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`box_id` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`reason` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`company_id`) REFERENCES `b2b_companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `b2b_shipments` ADD `trigger_reason` text;--> statement-breakpoint
ALTER TABLE `b2b_shipments` ADD `restocked_at` integer;--> statement-breakpoint
ALTER TABLE `b2b_shipments` ADD `restock_reminders_sent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `standard_bag_size` integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `bags_per_order` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `next_product_id` text;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `learning_mode` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `learning_mode_ends_at` integer;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `avg_daily_consumption` integer;--> statement-breakpoint
ALTER TABLE `smart_boxes` ADD `avg_weekly_consumption` integer;