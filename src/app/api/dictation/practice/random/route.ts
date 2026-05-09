import { NextResponse } from "next/server";
import {
  db,
  dictationSessions,
  dictationSessionItems,
  dictationWords,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { DictationRandomRules } from "@/types";

// POST - Generate a random dictation practice session
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body: DictationRandomRules & { name?: string } =
      await request.json();

    const {
      count = 10,
      orderBy = "random",
      orderDir = "desc",
      subject,
      name,
    } = body;

    // Get non-mastered dictation words with stats
    let query = db
      .select({
        id: dictationWords.id,
        totalPractices: sql<number>`COUNT(DISTINCT ${dictationSessionItems.id})`,
        totalErrors: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(dictationWords)
      .leftJoin(
        dictationSessionItems,
        eq(dictationWords.id, dictationSessionItems.dictationWordId)
      )
      .where(
        and(
          eq(dictationWords.userId, user.id),
          eq(dictationWords.isMastered, 0)
        )
      )
      .groupBy(dictationWords.id);

    if (subject && ["语文", "英语"].includes(subject)) {
      query = query.where(eq(dictationWords.subject, subject)) as typeof query;
    }

    let wordsWithStats = await query;

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

    // Create session
    const result = await db
      .insert(dictationSessions)
      .values({
        userId: user.id,
        name: name || `随机默写 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 1,
        randomRules: JSON.stringify({ count, orderBy, orderDir, subject }),
      })
      .returning({ id: dictationSessions.id });

    const sessionId = result[0].id;

    // Create session items
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
