import { db, grades, subjects } from "./db";
import { eq } from "drizzle-orm";

const DEFAULT_GRADES = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "初一", "初二", "初三", "高一", "高二", "高三",
];

const DEFAULT_SUBJECTS = ["语文", "数学", "英语"];

export async function seedDefaultGrades(userId: number) {
  const existing = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.userId, userId))
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(grades).values(
    DEFAULT_GRADES.map((name, i) => ({ userId, name, sortOrder: i }))
  );
}

export async function seedDefaultSubjects(userId: number) {
  const existing = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.userId, userId))
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(subjects).values(
    DEFAULT_SUBJECTS.map((name, i) => ({ userId, name, sortOrder: i }))
  );
}
