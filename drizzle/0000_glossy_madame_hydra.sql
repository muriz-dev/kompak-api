CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`activity_description` text,
	`activity_photo_url` text,
	`status` text NOT NULL,
	`verified_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_user_event_unique` ON `attendances` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `badge_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_definition_id` text NOT NULL,
	`leaderboard_year` integer,
	`leaderboard_period` text,
	`reason` text,
	`awarded_by` text,
	`awarded_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badge_definition_id`) REFERENCES `badge_definitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`awarded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `badge_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`category` text NOT NULL,
	`criteria` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `event_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`attendance_id` text NOT NULL,
	`event_id` text NOT NULL,
	`points` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attendance_id`) REFERENCES `attendances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_transactions_attendance_id_unique` ON `event_transactions` (`attendance_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`event_date` integer NOT NULL,
	`reward_points` integer NOT NULL,
	`attendance_start_time` integer NOT NULL,
	`attendance_end_time` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius_meters` integer DEFAULT 50 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`banner_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`logo_url` text,
	`store_photo_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `reward_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`points_spent` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`name` text NOT NULL,
	`points_required` integer DEFAULT 0 NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`leaderboard_position` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone_number` text NOT NULL,
	`birth_date` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`face_embedding_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`leaderboard_points` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);