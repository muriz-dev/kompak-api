CREATE TABLE `leaderboard_distributions` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`distributed_by` text NOT NULL,
	`distributed_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`distributed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_distributions_period_unique` ON `leaderboard_distributions` (`period`);