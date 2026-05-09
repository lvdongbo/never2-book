CREATE TABLE IF NOT EXISTS `dictation_words` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `subject` text NOT NULL,
  `word` text NOT NULL,
  `prompt` text NOT NULL DEFAULT '',
  `expected_answer` text NOT NULL,
  `wrong_answer` text NOT NULL DEFAULT '',
  `notes` text NOT NULL DEFAULT '',
  `is_mastered` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `dictation_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL DEFAULT '',
  `is_random` integer NOT NULL DEFAULT 0,
  `random_rules` text,
  `status` text NOT NULL DEFAULT 'in_progress',
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `dictation_session_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `session_id` integer NOT NULL REFERENCES `dictation_sessions`(`id`) ON DELETE CASCADE,
  `dictation_word_id` integer NOT NULL REFERENCES `dictation_words`(`id`) ON DELETE CASCADE,
  `user_answer` text NOT NULL DEFAULT '',
  `is_correct` integer,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `idx_dictation_words_user_id` ON `dictation_words`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_dictation_words_subject` ON `dictation_words`(`subject`);
CREATE INDEX IF NOT EXISTS `idx_dictation_sessions_user_id` ON `dictation_sessions`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_dictation_session_items_session_id` ON `dictation_session_items`(`session_id`);
CREATE INDEX IF NOT EXISTS `idx_dictation_session_items_word_id` ON `dictation_session_items`(`dictation_word_id`);
