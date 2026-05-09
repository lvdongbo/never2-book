CREATE TABLE IF NOT EXISTS `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `nickname` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `mistakes` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`),
  `subject` text NOT NULL,
  `question_text` text NOT NULL DEFAULT '',
  `question_images` text NOT NULL DEFAULT '[]',
  `explanation_text` text NOT NULL DEFAULT '',
  `explanation_images` text NOT NULL DEFAULT '[]',
  `is_mastered` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `practice_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`),
  `name` text NOT NULL DEFAULT '',
  `is_random` integer NOT NULL DEFAULT 0,
  `random_rules` text,
  `status` text NOT NULL DEFAULT 'in_progress',
  `graded_by` integer REFERENCES `users`(`id`),
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `practice_session_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `session_id` integer NOT NULL REFERENCES `practice_sessions`(`id`) ON DELETE CASCADE,
  `mistake_id` integer NOT NULL REFERENCES `mistakes`(`id`),
  `user_answer` text NOT NULL DEFAULT '',
  `is_correct` integer,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `idx_mistakes_user_id` ON `mistakes`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_mistakes_subject` ON `mistakes`(`subject`);
CREATE INDEX IF NOT EXISTS `idx_practice_sessions_user_id` ON `practice_sessions`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_practice_session_items_session_id` ON `practice_session_items`(`session_id`);
CREATE INDEX IF NOT EXISTS `idx_practice_session_items_mistake_id` ON `practice_session_items`(`mistake_id`);
