import { NextResponse } from "next/server";
import {
  db,
  practiceSessions,
  practiceSessionItems,
  mistakes,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { RandomRules, Subject } from "@/types";

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

// POST - Generate a random practice session
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
    const validOrderBy: RandomRules["orderBy"][] = ["practices", "errors", "random"];
    const orderBy =
      orderByInput === undefined
        ? "random"
        : (orderByInput as RandomRules["orderBy"]);
    if (!validOrderBy.includes(orderBy)) {
      return NextResponse.json(
        { success: false, message: "排序规则不合法" },
        { status: 400 }
      );
    }

    const orderDirInput = rawBody.orderDir;
    const validOrderDir: RandomRules["orderDir"][] = ["asc", "desc"];
    const orderDir =
      orderDirInput === undefined
        ? "desc"
        : (orderDirInput as RandomRules["orderDir"]);
    if (!validOrderDir.includes(orderDir)) {
      return NextResponse.json(
        { success: false, message: "排序方向不合法" },
        { status: 400 }
      );
    }

    const subjectInput = rawBody.subject;
    let subject: Subject | undefined;
    if (subjectInput !== undefined && subjectInput !== null && subjectInput !== "") {
      if (subjectInput !== "语文" && subjectInput !== "数学" && subjectInput !== "英语") {
        return NextResponse.json(
          { success: false, message: "学科参数不合法" },
          { status: 400 }
        );
      }
      subject = subjectInput;
    }

    const name =
      typeof rawBody.name === "string" && rawBody.name.trim()
        ? rawBody.name.trim()
        : undefined;

    const filters = [
      eq(mistakes.userId, user.id),
      eq(mistakes.isMastered, 0),
    ];

    if (subject) {
      filters.push(eq(mistakes.subject, subject));
    }

    const mistakesWithStats = await db
      .select({
        id: mistakes.id,
        totalPractices: sql<number>`COUNT(DISTINCT ${practiceSessionItems.id})`,
        totalErrors: sql<number>`SUM(CASE WHEN ${practiceSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(mistakes)
      .leftJoin(
        practiceSessionItems,
        eq(mistakes.id, practiceSessionItems.mistakeId)
      )
      .where(and(...filters))
      .groupBy(mistakes.id);

    if (mistakesWithStats.length === 0) {
      return NextResponse.json(
        { success: false, message: "没有可练习的错题（所有错题已过关或不存在）" },
        { status: 400 }
      );
    }

    // Sort based on rules
    const sorted = [...mistakesWithStats].sort((a, b) => {
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

    const randomRules: RandomRules = {
      count,
      orderBy,
      orderDir,
      ...(subject ? { subject } : {}),
    };

    // Create session
    const result = await db
      .insert(practiceSessions)
      .values({
        userId: user.id,
        name: name || `随机练习 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 1,
        randomRules: JSON.stringify(randomRules),
      })
      .returning({ id: practiceSessions.id });

    const sessionId = result[0].id;

    // Create session items
    await db.insert(practiceSessionItems).values(
      selected.map((m) => ({
        sessionId,
        mistakeId: m.id,
        userAnswer: "",
      }))
    );

    return NextResponse.json({
      success: true,
      data: { id: sessionId, count: selected.length },
      message: `已随机生成 ${selected.length} 道题的练习`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Random practice error:", error);
    return NextResponse.json(
      { success: false, message: "生成随机练习失败" },
      { status: 500 }
    );
  }
}
