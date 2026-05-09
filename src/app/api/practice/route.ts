import { NextResponse } from "next/server";
import { db, practiceSessions, practiceSessionItems, mistakes } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - List practice sessions for current user
export async function GET() {
  try {
    const user = await requireAuth();

    const sessions = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, user.id))
      .orderBy(desc(practiceSessions.id));

    // Get item count for each session
    const sessionsWithCount = await Promise.all(
      sessions.map(async (session) => {
        const items = await db
          .select()
          .from(practiceSessionItems)
          .where(eq(practiceSessionItems.sessionId, session.id));

        const gradedCount = items.filter((i) => i.isCorrect !== null).length;
        const correctCount = items.filter((i) => i.isCorrect === 1).length;

        return {
          ...session,
          randomRules: session.randomRules
            ? JSON.parse(session.randomRules)
            : null,
          totalItems: items.length,
          gradedItems: gradedCount,
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

// POST - Create a manual practice session
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { name, mistakeIds } = await request.json();

    if (!mistakeIds || !Array.isArray(mistakeIds) || mistakeIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "请选择至少一道错题" },
        { status: 400 }
      );
    }

    // Verify mistakes belong to user and are not mastered
    const userMistakes = await db
      .select({ id: mistakes.id })
      .from(mistakes)
      .where(
        and(
          eq(mistakes.userId, user.id),
          eq(mistakes.isMastered, 0)
        )
      );

    const validIds = new Set(userMistakes.map((m) => m.id));
    const validMistakeIds = mistakeIds.filter((id: number) => validIds.has(id));

    if (validMistakeIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "所选错题不存在或已过关" },
        { status: 400 }
      );
    }

    // Create session
    const result = await db
      .insert(practiceSessions)
      .values({
        userId: user.id,
        name: name || `练习 ${new Date().toLocaleString("zh-CN")}`,
        isRandom: 0,
      })
      .returning({ id: practiceSessions.id });

    const sessionId = result[0].id;

    // Create session items
    await db.insert(practiceSessionItems).values(
      validMistakeIds.map((mistakeId: number) => ({
        sessionId,
        mistakeId,
        userAnswer: "",
      }))
    );

    return NextResponse.json({
      success: true,
      data: { id: sessionId },
      message: "练习创建成功",
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
