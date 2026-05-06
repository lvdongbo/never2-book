import { NextResponse } from "next/server";
import {
  db,
  practiceSessions,
  practiceSessionItems,
  mistakes,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { RandomRules } from "@/types";

// POST - Generate a random practice session
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body: RandomRules & { name?: string } = await request.json();

    const { count = 10, orderBy = "random", orderDir = "desc", subject, name } = body;

    // Get non-mastered mistakes with stats
    let query = db
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
      .where(
        and(
          eq(mistakes.userId, user.id),
          eq(mistakes.isMastered, 0)
        )
      )
      .groupBy(mistakes.id);

    // Apply subject filter
    if (subject && ["语文", "数学", "英语"].includes(subject)) {
      query = query.where(eq(mistakes.subject, subject)) as typeof query;
    }

    let mistakesWithStats = await query;

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

    // Select the appropriate number
    const selected =
      orderBy === "random"
        ? sorted.slice(0, Math.min(count, sorted.length))
        : sorted.slice(0, Math.min(count, sorted.length));

    // Create session
    const result = await db
      .insert(practiceSessions)
      .values({
        userId: user.id,
        name: name || `随机练习 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 1,
        randomRules: JSON.stringify({ count, orderBy, orderDir, subject }),
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
