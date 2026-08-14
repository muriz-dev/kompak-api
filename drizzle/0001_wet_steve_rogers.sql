PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reward_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`points_spent` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`completed_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `__new_reward_redemptions`(
	`id`, `user_id`, `reward_id`, `provider_id`, `points_spent`,
	`idempotency_key`, `status`, `completed_at`, `expires_at`, `created_at`, `updated_at`
)
SELECT
	`id`, `user_id`, `reward_id`, `provider_id`, `points_spent`,
	'legacy-' || `id`, `status`, `completed_at`,
	COALESCE(`created_at`, unixepoch() * 1000) + 604800000,
	`created_at`, `updated_at`
FROM `reward_redemptions`;--> statement-breakpoint
DROP TABLE `reward_redemptions`;--> statement-breakpoint
ALTER TABLE `__new_reward_redemptions` RENAME TO `reward_redemptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `reward_redemption_user_idempotency_unique` ON `reward_redemptions` (`user_id`,`idempotency_key`);--> statement-breakpoint
ALTER TABLE `rewards` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `rewards` ADD `is_featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rewards` ADD `validity_days` integer DEFAULT 7 NOT NULL;--> statement-breakpoint
CREATE TRIGGER `reward_redemptions_validate_insert`
BEFORE INSERT ON `reward_redemptions`
BEGIN
	SELECT CASE WHEN COALESCE((
		SELECT `status` = 'ACTIVE' AND `stock` > 0
		FROM `rewards` WHERE `id` = NEW.`reward_id`
	), 0) = 0 THEN RAISE(ABORT, 'reward_not_redeemable') END;
	SELECT CASE WHEN COALESCE((
		SELECT `status` = 'VERIFIED'
		FROM `providers` WHERE `id` = NEW.`provider_id`
	), 0) = 0 THEN RAISE(ABORT, 'reward_not_redeemable') END;
	SELECT CASE WHEN COALESCE((
		SELECT `provider_id` = NEW.`provider_id` AND (
			(`source` = 'POINT_SHOP' AND `points_required` = NEW.`points_spent`) OR
			(`source` = 'LEADERBOARD' AND NEW.`points_spent` = 0)
		)
		FROM `rewards` WHERE `id` = NEW.`reward_id`
	), 0) = 0 THEN RAISE(ABORT, 'reward_not_redeemable') END;
	SELECT CASE WHEN COALESCE((
		SELECT `rewards`.`source` = 'LEADERBOARD' OR `users`.`balance` >= NEW.`points_spent`
		FROM `users`, `rewards`
		WHERE `users`.`id` = NEW.`user_id` AND `rewards`.`id` = NEW.`reward_id`
	), 0) = 0 THEN RAISE(ABORT, 'insufficient_points') END;
END;--> statement-breakpoint
CREATE TRIGGER `reward_redemptions_apply_insert`
AFTER INSERT ON `reward_redemptions`
BEGIN
	UPDATE `users`
	SET `balance` = `balance` - NEW.`points_spent`, `updated_at` = unixepoch() * 1000
	WHERE `id` = NEW.`user_id`
		AND (SELECT `source` FROM `rewards` WHERE `id` = NEW.`reward_id`) = 'POINT_SHOP';
	UPDATE `rewards`
	SET `stock` = `stock` - 1, `updated_at` = unixepoch() * 1000
	WHERE `id` = NEW.`reward_id`;
END;--> statement-breakpoint
CREATE TRIGGER `reward_redemptions_apply_refund`
AFTER UPDATE OF `status` ON `reward_redemptions`
WHEN OLD.`status` = 'PENDING' AND NEW.`status` IN ('REJECTED', 'CANCELLED')
BEGIN
	UPDATE `users`
	SET `balance` = `balance` + NEW.`points_spent`, `updated_at` = unixepoch() * 1000
	WHERE `id` = NEW.`user_id`
		AND (SELECT `source` FROM `rewards` WHERE `id` = NEW.`reward_id`) = 'POINT_SHOP';
	UPDATE `rewards`
	SET `stock` = `stock` + 1, `updated_at` = unixepoch() * 1000
	WHERE `id` = NEW.`reward_id`;
END;
