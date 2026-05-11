import { NextResponse } from "next/server";
import { db, dictationSessions, dictationSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Submit session for manual grading
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sessionId = parseInt(id);

    const session = await db
      .select({ id: dictationSessions.id, status: dictationSessions.status })
      .from(dictationSessions)
      .where(
        and(
          eq(dictationSessions.id, sessionId),
          eq(dictationSessions.userId, user.id)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json(
        { success: false, message: "练习不存在" },
        { status: 404 }
      );
    }

    if (session[0].status !== "in_progress") {
      return NextResponse.json(
        { success: false, message: "练习已提交，无法重复提交" },
        { status: 400 }
      );
    }

    await db
      .update(dictationSessions)
      .set({
        status: "submitted",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dictationSessions.id, sessionId));

    const items = await db
      .select({ isCorrect: dictationSessionItems.isCorrect })
      .from(dictationSessionItems)
      .where(eq(dictationSessionItems.sessionId, sessionId));

    const totalCount = items.length;
    const correctCount = items.filter((item) => item.isCorrect === 1).length;
    const ungradedCount = items.filter((item) => item.isCorrect === null).length;

    return NextResponse.json({
      success: true,
      message: "已提交，等待家长批改",
      data: {
        correctCount,
        totalCount,
        ungradedCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Submit dictation error:", error);
    return NextResponse.json(
      { success: false, message: "提交失败" },
      { status: 500 }
    );
  }
}
