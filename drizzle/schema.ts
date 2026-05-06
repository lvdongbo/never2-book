import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const mistakes = sqliteTable("mistakes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(), // 语文, 数学, 英语
  questionText: text("question_text").notNull().default(""),
  questionImages: text("question_images").notNull().default("[]"), // JSON array of URLs
  explanationText: text("explanation_text").notNull().default(""),
  explanationImages: text("explanation_images").notNull().default("[]"), // JSON array of URLs
  isMastered: integer("is_mastered").notNull().default(0), // 0=待过关, 1=已过关
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const practiceSessions = sqliteTable("practice_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  isRandom: integer("is_random").notNull().default(0),
  randomRules: text("random_rules"), // JSON: { count, orderBy, orderDir }
  status: text("status").notNull().default("in_progress"), // in_progress, submitted, graded
  gradedBy: integer("graded_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const practiceSessionItems = sqliteTable("practice_session_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
  mistakeId: integer("mistake_id")
    .notNull()
    .references(() => mistakes.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull().default(""),
  isCorrect: integer("is_correct"), // NULL=未批改, 0=错误, 1=正确
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
