CREATE TABLE `library_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`theme` varchar(120),
	`mood` varchar(80),
	`song_name` varchar(255),
	`thumbnail_url` varchar(1024),
	`video_url` varchar(1024) NOT NULL,
	`rating` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `library_items` ADD CONSTRAINT `library_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `library_items_user_id_idx` ON `library_items` (`user_id`);
--> statement-breakpoint
CREATE INDEX `library_items_created_at_idx` ON `library_items` (`created_at`);
