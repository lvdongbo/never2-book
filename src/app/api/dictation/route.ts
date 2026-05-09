import { NextResponse } from "next/server";
import { db, dictationWords, dictationSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, like, sql } from "drizzle-orm";
import type { CreateDictationWordInput } from "@/types";

// GET - List all dictation words for the current user, with stats
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const tagFilter = searchParams.get("tag");

    let query = db
      .select({
        id: dictationWords.id,
        userId: dictationWords.userId,
        subject: dictationWords.subject,
        word: dictationWords.word,
        prompt: dictationWords.prompt,
        expectedAnswer: dictationWords.expectedAnswer,
        wrongAnswer: dictationWords.wrongAnswer,
        notes: dictationWords.notes,
        tags: dictationWords.tags,
        isMastered: dictationWords.isMastered,
        createdAt: dictationWords.createdAt,
        updatedAt: dictationWords.updatedAt,
        totalPractices: sql<number>`COUNT(DISTINCT ${dictationSessionItems.id})`,
        totalCorrect: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        totalWrong: sql<number>`SUM(CASE WHEN ${dictationSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(dictationWords)
      .leftJoin(
        dictationSessionItems,
        eq(dictationWords.id, dictationSessionItems.dictationWordId)
      )
      .where(eq(dictationWords.userId, user.id))
      .groupBy(dictationWords.id)
      .orderBy(sql`${dictationWords.updatedAt} DESC`);

    // Apply tag filter if provided
    if (tagFilter) {
      query = query.where(
        like(dictationWords.tags, `%"${tagFilter}"%`)
      ) as typeof query;
    }

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

    if (!body.subject || !["语文", "英语"].includes(body.subject)) {
      return NextResponse.json(
        { success: false, message: "请选择有效的科目" },
        { status: 400 }
      );
    }

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

    const result = await db
      .insert(dictationWords)
      .values({
        userId: user.id,
        subject: body.subject,
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
