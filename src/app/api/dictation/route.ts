import { NextResponse } from "next/server";
import { db, dictationWords, dictationSessionItems, grades, subjects, units } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, like, sql, gte, lte } from "drizzle-orm";
import type { CreateDictationWordInput } from "@/types";
import { SEMESTERS } from "@/types";

// GET - List all dictation words for the current user, with stats
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tagFilters = searchParams.getAll("tag").filter(Boolean);
    const gradeFilter = searchParams.get("gradeId");
    const subjectFilter = searchParams.get("subjectId");
    const unitFilter = searchParams.get("unitId");
    const semesterFilter = searchParams.get("semester");
    const totalCorrectMinRaw = searchParams.get("totalCorrectMin");
    const totalCorrectMaxRaw = searchParams.get("totalCorrectMax");

    const parseNonNegativeInt = (value: string | null, label: string) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) {
        throw new Error(`${label}必须是非负整数`);
      }
      return Number(trimmed);
    };

    let totalCorrectMin: number | null;
    let totalCorrectMax: number | null;
    try {
      totalCorrectMin = parseNonNegativeInt(totalCorrectMinRaw, "正确次数下限");
      totalCorrectMax = parseNonNegativeInt(totalCorrectMaxRaw, "正确次数上限");
      if (
        totalCorrectMin !== null &&
        totalCorrectMax !== null &&
        totalCorrectMin > totalCorrectMax
      ) {
        return NextResponse.json(
          { success: false, message: "正确次数下限不能大于上限" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "正确次数筛选参数不合法",
        },
        { status: 400 }
      );
    }

    const filters = [eq(dictationWords.userId, user.id)];
    if (gradeFilter) {
      filters.push(eq(dictationWords.gradeId, parseInt(gradeFilter)));
    }
    if (subjectFilter) {
      filters.push(eq(dictationWords.subjectId, parseInt(subjectFilter)));
    }
    if (unitFilter) {
      filters.push(eq(dictationWords.unitId, parseInt(unitFilter)));
    }
    if (tagFilters.length > 0) {
      filters.push(
        sql`(${sql.join(
          tagFilters.map((tag) => like(dictationWords.tags, `%\"${tag}\"%`)),
          sql` OR `
        )})`
      );
    }
    if (semesterFilter) {
      filters.push(
        sql`(${dictationWords.semester} = ${semesterFilter} OR ${units.semester} = ${semesterFilter})`
      );
    }

    const statsSubquery = db
      .select({
        wordId: dictationSessionItems.dictationWordId,
        totalPractices: sql<number>`COUNT(DISTINCT ${dictationSessionItems.id})`.as("total_practices"),
        totalCorrect: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 1 THEN 1 ELSE 0 END)`.as("total_correct"),
        totalWrong: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`.as("total_wrong"),
      })
      .from(dictationSessionItems)
      .groupBy(dictationSessionItems.dictationWordId)
      .as("stats");

    const totalCorrectExpr = sql<number>`COALESCE(${statsSubquery.totalCorrect}, 0)`;
    if (totalCorrectMin !== null) {
      filters.push(gte(totalCorrectExpr, totalCorrectMin));
    }
    if (totalCorrectMax !== null) {
      filters.push(lte(totalCorrectExpr, totalCorrectMax));
    }

    const query = db
      .select({
        id: dictationWords.id,
        userId: dictationWords.userId,
        subject: dictationWords.subject,
        gradeId: dictationWords.gradeId,
        subjectId: dictationWords.subjectId,
        unitId: dictationWords.unitId,
        semester: dictationWords.semester,
        word: dictationWords.word,
        prompt: dictationWords.prompt,
        expectedAnswer: dictationWords.expectedAnswer,
        wrongAnswer: dictationWords.wrongAnswer,
        notes: dictationWords.notes,
        tags: dictationWords.tags,
        isMastered: dictationWords.isMastered,
        createdAt: dictationWords.createdAt,
        updatedAt: dictationWords.updatedAt,
        gradeName: grades.name,
        subjectName: subjects.name,
        unitName: units.name,
        unitSemester: units.semester,
        totalPractices: sql<number>`COALESCE(${statsSubquery.totalPractices}, 0)`,
        totalCorrect: sql<number>`COALESCE(${statsSubquery.totalCorrect}, 0)`,
        totalWrong: sql<number>`COALESCE(${statsSubquery.totalWrong}, 0)`,
      })
      .from(dictationWords)
      .leftJoin(grades, eq(dictationWords.gradeId, grades.id))
      .leftJoin(subjects, eq(dictationWords.subjectId, subjects.id))
      .leftJoin(units, eq(dictationWords.unitId, units.id))
      .leftJoin(statsSubquery, eq(dictationWords.id, statsSubquery.wordId))
      .where(and(...filters))
      .orderBy(sql`${dictationWords.updatedAt} DESC`);

    const rows = await query;

    const wordsWithStats = rows.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      isMastered: row.isMastered === 1,
      totalPractices: Number(row.totalPractices) || 0,
      totalCorrect: Number(row.totalCorrect) || 0,
      totalWrong: Number(row.totalWrong) || 0,
      correctRate:
        Number(row.totalPractices) > 0
          ? Math.round(
              ((Number(row.totalCorrect) || 0) / Number(row.totalPractices)) *
                100
            )
          : 0,
      grade: row.gradeName ? { id: row.gradeId, name: row.gradeName } : undefined,
      subjectEntity: row.subjectName ? { id: row.subjectId, name: row.subjectName } : undefined,
      unit: row.unitName ? { id: row.unitId, name: row.unitName, semester: row.unitSemester } : undefined,
    }));

    return NextResponse.json({ success: true, data: wordsWithStats });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("List dictation words error:", error);
    return NextResponse.json(
      { success: false, message: "获取默写词列表失败" },
      { status: 500 }
    );
  }
}

// POST - Create a new dictation word
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body: CreateDictationWordInput = await request.json();

    if (!body.word.trim()) {
      return NextResponse.json(
        { success: false, message: "请输入词语" },
        { status: 400 }
      );
    }

    if (!body.expectedAnswer.trim()) {
      return NextResponse.json(
        { success: false, message: "请输入正确答案" },
        { status: 400 }
      );
    }

    if (
      body.semester !== undefined &&
      body.semester !== null &&
      !SEMESTERS.includes(body.semester)
    ) {
      return NextResponse.json(
        { success: false, message: "学期参数不合法" },
        { status: 400 }
      );
    }

    // Resolve subject name from subjectId if provided
    let subjectName = body.subject || "";
    if (body.subjectId) {
      const subjectRows = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(and(eq(subjects.id, body.subjectId), eq(subjects.userId, user.id)))
        .limit(1);
      if (subjectRows.length === 0) {
        return NextResponse.json(
          { success: false, message: "请选择有效的学科" },
          { status: 400 }
        );
      }
      subjectName = subjectRows[0].name;
    }

    const result = await db
      .insert(dictationWords)
      .values({
        userId: user.id,
        subject: subjectName,
        gradeId: body.gradeId ?? null,
        subjectId: body.subjectId ?? null,
        unitId: body.unitId ?? null,
        semester: body.semester ?? null,
        word: body.word.trim(),
        prompt: body.prompt || "",
        expectedAnswer: body.expectedAnswer.trim(),
        wrongAnswer: body.wrongAnswer || "",
        notes: body.notes || "",
        tags: JSON.stringify(body.tags || []),
      })
      .returning({ id: dictationWords.id });

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
      message: "默写词添加成功",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Create dictation word error:", error);
    return NextResponse.json(
      { success: false, message: "添加默写词失败" },
      { status: 500 }
    );
  }
}
