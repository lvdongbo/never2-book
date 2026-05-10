import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull().default(""),
  currentGradeId: integer("current_grade_id"),
  currentSemester: text("current_semester"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const mistakes = pgTable("mistakes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  questionText: text("question_text").notNull().default(""),
  questionImages: text("question_images").notNull().default("[]"),
  explanationText: text("explanation_text").notNull().default(""),
  explanationImages: text("explanation_images").notNull().default("[]"),
  isMastered: integer("is_mastered").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  isRandom: integer("is_random").notNull().default(0),
  randomRules: text("random_rules"),
  status: text("status").notNull().default("in_progress"),
  gradedBy: integer("graded_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const practiceSessionItems = pgTable("practice_session_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
  mistakeId: integer("mistake_id")
    .notNull()
    .references(() => mistakes.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull().default(""),
  isCorrect: integer("is_correct"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

// ============ Dictation (默写) ============

// ============ Reference Data ============

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grades.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  semester: text("semester").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const dictationWords = pgTable("dictation_words", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  gradeId: integer("grade_id").references(() => grades.id, { onDelete: "set null" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "set null" }),
  semester: text("semester"),
  word: text("word").notNull(),
  prompt: text("prompt").notNull().default(""),
  expectedAnswer: text("expected_answer").notNull(),
  wrongAnswer: text("wrong_answer").notNull().default(""),
  notes: text("notes").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  isMastered: integer("is_mastered").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const dictationSessions = pgTable("dictation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  isRandom: integer("is_random").notNull().default(0),
  randomRules: text("random_rules"),
  status: text("status").notNull().default("in_progress"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const dictationSessionItems = pgTable("dictation_session_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => dictationSessions.id, { onDelete: "cascade" }),
  dictationWordId: integer("dictation_word_id")
    .notNull()
    .references(() => dictationWords.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull().default(""),
  isCorrect: integer("is_correct"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});
