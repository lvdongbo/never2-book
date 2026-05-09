import { NextResponse } from "next/server";
import { db, dictationSessions, dictationSessionItems, dictationWords } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - List practice sessions for current user
export async function GET() {
  try {
    const user = await requireAuth();

    const sessions = await db
      .select()
      .from(dictationSessions)
      .where(eq(dictationSessions.userId, user.id))
      .orderBy(desc(dictationSessions.id));

    const sessionsWithCount = await Promise.all(
      sessions.map(async (session) => {
        const items = await db
          .select()
          .from(dictationSessionItems)
          .where(eq(dictationSessionItems.sessionId, session.id));

        const gradedCount = items.filter((i) => i.isCorrect !== null).length;
        const correctCount = items.filter((i) => i.isCorrect === 1).length;
        const ungradedCount = items.filter((i) => i.isCorrect === null).length;

        return {
          ...session,
          randomRules: session.randomRules
            ? JSON.parse(session.randomRules)
            : null,
          totalItems: items.length,
          gradedItems: gradedCount,
          ungradedItems: ungradedCount,
          correctItems: correctCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: sessionsWithCount });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "获取练习列表失败" },
      { status: 500 }
    );
  }
}

// POST - Create a manual dictation practice session
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { name, wordIds } = await request.json();

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "请选择至少一个默写词" },
        { status: 400 }
      );
    }

    // Verify words belong to user and are not mastered
    const userWords = await db
      .select({ id: dictationWords.id })
      .from(dictationWords)
      .where(
        and(eq(dictationWords.userId, user.id), eq(dictationWords.isMastered, 0))
      );

    const validIds = new Set(userWords.map((w) => w.id));
    const validWordIds = wordIds.filter((id: number) => validIds.has(id));

    if (validWordIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "所选默写词不存在或已过关" },
        { status: 400 }
      );
    }

    // Create session
    const result = await db
      .insert(dictationSessions)
      .values({
        userId: user.id,
        name: name || `默写练习 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 0,
      })
      .returning({ id: dictationSessions.id });

    const sessionId = result[0].id;

    // Create session items
    await db.insert(dictationSessionItems).values(
      validWordIds.map((wordId: number) => ({
        sessionId,
        dictationWordId: wordId,
        userAnswer: "",
      }))
    );

    return NextResponse.json({
      success: true,
      data: { id: sessionId },
      message: "默写练习创建成功",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建练习失败" },
      { status: 500 }
    );
  }
}
