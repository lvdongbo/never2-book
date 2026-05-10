-- Create grades table
CREATE TABLE `grades` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX `idx_grades_user_id` ON `grades`(`user_id`);

-- Create subjects table
CREATE TABLE `subjects` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX `idx_subjects_user_id` ON `subjects`(`user_id`);

-- Create units table
CREATE TABLE `units` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `grade_id` integer NOT NULL REFERENCES `grades`(`id`) ON DELETE CASCADE,
  `subject_id` integer NOT NULL REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `semester` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX `idx_units_user_id` ON `units`(`user_id`);
CREATE INDEX `idx_units_grade_id` ON `units`(`grade_id`);
CREATE INDEX `idx_units_subject_id` ON `units`(`subject_id`);

-- Add reference columns to dictation_words
ALTER TABLE `dictation_words` ADD COLUMN `grade_id` integer REFERENCES `grades`(`id`) ON DELETE SET NULL;
ALTER TABLE `dictation_words` ADD COLUMN `subject_id` integer REFERENCES `subjects`(`id`) ON DELETE SET NULL;
ALTER TABLE `dictation_words` ADD COLUMN `unit_id` integer REFERENCES `units`(`id`) ON DELETE SET NULL;

CREATE INDEX `idx_dictation_words_grade_id` ON `dictation_words`(`grade_id`);
CREATE INDEX `idx_dictation_words_subject_id` ON `dictation_words`(`subject_id`);
CREATE INDEX `idx_dictation_words_unit_id` ON `dictation_words`(`unit_id`);
