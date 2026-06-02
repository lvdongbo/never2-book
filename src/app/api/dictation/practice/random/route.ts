import { NextResponse } from "next/server";
import {
  db,
  dictationSessions,
  dictationSessionItems,
  dictationWords,
  units,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { DictationRandomRules, DictationSubject, Semester } from "@/types";
import { SEMESTERS } from "@/types";

function parseOptionalPositiveInt(value: unknown): number | undefined | null {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) {
      return null;
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    const parsed = parseInt(trimmed, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  return null;
}

// POST - Generate a random dictation practice session
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const rawBody = (await request.json()) as Record<string, unknown>;

    const countInput = rawBody.count;
    const countParsed = parseOptionalPositiveInt(countInput);
    if (countParsed === null) {
      return NextResponse.json(
        { success: false, message: "题目数量必须是正整数" },
        { status: 400 }
      );
    }
    const count = Math.max(1, Math.min(50, countParsed ?? 10));

    const orderByInput = rawBody.orderBy;
    const validOrderBy: DictationRandomRules["orderBy"][] = [
      "practices",
      "errors",
      "random",
    ];
    const orderBy =
      orderByInput === undefined
        ? "random"
        : (orderByInput as DictationRandomRules["orderBy"]);
    if (!validOrderBy.includes(orderBy)) {
      return NextResponse.json(
        { success: false, message: "排序规则不合法" },
        { status: 400 }
      );
    }

    const orderDirInput = rawBody.orderDir;
    const validOrderDir: DictationRandomRules["orderDir"][] = ["asc", "desc"];
    const orderDir =
      orderDirInput === undefined
        ? "desc"
        : (orderDirInput as DictationRandomRules["orderDir"]);
    if (!validOrderDir.includes(orderDir)) {
      return NextResponse.json(
        { success: false, message: "排序方向不合法" },
        { status: 400 }
      );
    }

    const subjectInput = rawBody.subject;
    let subject: DictationSubject | undefined;
    if (subjectInput !== undefined && subjectInput !== null && subjectInput !== "") {
      if (subjectInput !== "语文" && subjectInput !== "英语") {
        return NextResponse.json(
          { success: false, message: "学科参数不合法" },
          { status: 400 }
        );
      }
      subject = subjectInput;
    }

    const gradeId = parseOptionalPositiveInt(rawBody.gradeId);
    if (gradeId === null) {
      return NextResponse.json(
        { success: false, message: "年级参数不合法" },
        { status: 400 }
      );
    }

    const subjectId = parseOptionalPositiveInt(rawBody.subjectId);
    if (subjectId === null) {
      return NextResponse.json(
        { success: false, message: "学科参数不合法" },
        { status: 400 }
      );
    }

    const unitId = parseOptionalPositiveInt(rawBody.unitId);
    if (unitId === null) {
      return NextResponse.json(
        { success: false, message: "单元参数不合法" },
        { status: 400 }
      );
    }

    const semesterInput = rawBody.semester;
    let semester: Semester | undefined;
    if (semesterInput !== undefined && semesterInput !== null && semesterInput !== "") {
      if (
        typeof semesterInput !== "string" ||
        !SEMESTERS.includes(semesterInput as Semester)
      ) {
        return NextResponse.json(
          { success: false, message: "学期参数不合法" },
          { status: 400 }
        );
      }
      semester = semesterInput as Semester;
    }

    const name =
      typeof rawBody.name === "string" && rawBody.name.trim()
        ? rawBody.name.trim()
        : undefined;

    const filters = [
      eq(dictationWords.userId, user.id),
      eq(dictationWords.isMastered, 0),
    ];

    if (subject) {
      filters.push(eq(dictationWords.subject, subject));
    }
    if (gradeId) {
      filters.push(eq(dictationWords.gradeId, gradeId));
    }
    if (subjectId) {
      filters.push(eq(dictationWords.subjectId, subjectId));
    }
    if (unitId) {
      filters.push(eq(dictationWords.unitId, unitId));
    }
    if (semester) {
      filters.push(
        sql`(${dictationWords.semester} = ${semester} OR ${units.semester} = ${semester})`
      );
    }

    const wordsWithStats = await db
      .select({
        id: dictationWords.id,
        totalPractices: sql<number>`COUNT(DISTINCT ${dictationSessionItems.id})`,
        totalErrors: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(dictationWords)
      .leftJoin(units, eq(dictationWords.unitId, units.id))
      .leftJoin(
        dictationSessionItems,
        eq(dictationWords.id, dictationSessionItems.dictationWordId)
      )
      .where(and(...filters))
      .groupBy(dictationWords.id);

    if (wordsWithStats.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "没有可练习的默写词（所有默写词已过关或不存在）",
        },
        { status: 400 }
      );
    }

    const sorted = [...wordsWithStats].sort((a, b) => {
      switch (orderBy) {
        case "practices":
          return orderDir === "desc"
            ? b.totalPractices - a.totalPractices
            : a.totalPractices - b.totalPractices;
        case "errors":
          return orderDir === "desc"
            ? b.totalErrors - a.totalErrors
            : a.totalErrors - b.totalErrors;
        case "random":
        default:
          return Math.random() - 0.5;
      }
    });

    const selected = sorted.slice(0, Math.min(count, sorted.length));

    const randomRules: DictationRandomRules = {
      count,
      orderBy,
      orderDir,
      ...(subject ? { subject } : {}),
      ...(gradeId ? { gradeId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(semester ? { semester } : {}),
    };

    const result = await db
      .insert(dictationSessions)
      .values({
        userId: user.id,
        name: name || `随机默写 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 1,
        randomRules: JSON.stringify(randomRules),
      })
      .returning({ id: dictationSessions.id });

    const sessionId = result[0].id;

    await db.insert(dictationSessionItems).values(
      selected.map((w) => ({
        sessionId,
        dictationWordId: w.id,
        userAnswer: "",
      }))
    );

    return NextResponse.json({
      success: true,
      data: { id: sessionId, count: selected.length },
      message: `已随机生成 ${selected.length} 个默写词的练习`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Random dictation practice error:", error);
    return NextResponse.json(
      { success: false, message: "生成随机练习失败" },
      { status: 500 }
    );
  }
}
