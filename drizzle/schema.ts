import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull().default(""),
  currentGradeId: integer("current_grade_id"),
  currentSemester: text("current_semester"),
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

// ============ Dictation (默写) ============

// ============ Reference Data ============

export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const units = sqliteTable("units", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  semester: text("semester").notNull(), // 上学期, 下学期
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dictationWords = sqliteTable("dictation_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(), // 语文, 英语
  gradeId: integer("grade_id").references(() => grades.id, { onDelete: "set null" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "set null" }),
  semester: text("semester"),
  word: text("word").notNull(), // 要默写的词语
  prompt: text("prompt").notNull().default(""), // 提示（中文释义、拼音等）
  expectedAnswer: text("expected_answer").notNull(), // 正确答案
  wrongAnswer: text("wrong_answer").notNull().default(""), // 学生写错的内容
  notes: text("notes").notNull().default(""), // 记忆技巧/备注
  tags: text("tags").notNull().default("[]"), // JSON array of tag strings
  isMastered: integer("is_mastered").notNull().default(0), // 0=待过关, 1=已过关
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dictationSessions = sqliteTable("dictation_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  isRandom: integer("is_random").notNull().default(0),
  randomRules: text("random_rules"), // JSON: { count, orderBy, orderDir, subject? }
  status: text("status").notNull().default("in_progress"), // in_progress, submitted
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dictationSessionItems = sqliteTable("dictation_session_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => dictationSessions.id, { onDelete: "cascade" }),
  dictationWordId: integer("dictation_word_id")
    .notNull()
    .references(() => dictationWords.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull().default(""),
  isCorrect: integer("is_correct"), // NULL=未提交, 0=错误, 1=正确（提交时自动判定）
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
