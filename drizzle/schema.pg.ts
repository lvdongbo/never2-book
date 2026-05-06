import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull().default(""),
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
