ALTER TABLE `library_items` ADD `description` varchar(1024);
--> statement-breakpoint
ALTER TABLE `library_items` ADD `tags` varchar(512);
--> statement-breakpoint
ALTER TABLE `library_items` ADD `is_in_library` int NOT NULL DEFAULT 1;
