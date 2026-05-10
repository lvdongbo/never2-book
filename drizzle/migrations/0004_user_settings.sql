ALTER TABLE `users` ADD COLUMN `current_grade_id` integer REFERENCES `grades`(`id`) ON DELETE SET NULL;
ALTER TABLE `users` ADD COLUMN `current_semester` text;
