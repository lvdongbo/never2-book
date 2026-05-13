import { NextResponse } from "next/server";
import { db, dictationSessions, dictationSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Submit session for manual grading / finalize manual grades
export async function PUT(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const manualGrades = body?.manualGrades as
      | Record<string, 0 | 1 | boolean>
      | undefined;

    if (session[0].status === "in_progress") {
      if (manualGrades) {
        return NextResponse.json(
          { success: false, message: "练习尚未提交，无法批改" },
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
    } else if (session[0].status === "submitted") {
      if (!manualGrades || Object.keys(manualGrades).length === 0) {
        return NextResponse.json(
          { success: false, message: "请先完成批改再提交" },
          { status: 400 }
        );
      }

      const validItems = await db
        .select({ id: dictationSessionItems.id })
        .from(dictationSessionItems)
        .where(eq(dictationSessionItems.sessionId, sessionId));

      const validItemIdSet = new Set(validItems.map((item) => item.id));
      const updates = Object.entries(manualGrades);

      for (const [itemIdText, rawValue] of updates) {
        const itemId = Number(itemIdText);

        if (!Number.isInteger(itemId) || !validItemIdSet.has(itemId)) {
          return NextResponse.json(
            { success: false, message: "存在无效题目，无法提交批改" },
            { status: 400 }
          );
        }

        const grade = rawValue === 1 || rawValue === true ? 1 : 0;

        await db
          .update(dictationSessionItems)
          .set({ isCorrect: grade })
          .where(
            and(
              eq(dictationSessionItems.id, itemId),
              eq(dictationSessionItems.sessionId, sessionId)
            )
          );
      }

      await db
        .update(dictationSessions)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(dictationSessions.id, sessionId));
    } else {
      return NextResponse.json(
        { success: false, message: "当前状态不支持提交" },
        { status: 400 }
      );
    }

    const items = await db
      .select({ isCorrect: dictationSessionItems.isCorrect })
      .from(dictationSessionItems)
      .where(eq(dictationSessionItems.sessionId, sessionId));

    const totalCount = items.length;
    const correctCount = items.filter((item) => item.isCorrect === 1).length;
    const ungradedCount = items.filter((item) => item.isCorrect === null).length;

    const nextStatus =
      session[0].status === "in_progress"
        ? "submitted"
        : ungradedCount === 0
        ? "graded"
        : "submitted";

    if (nextStatus === "graded") {
      await db
        .update(dictationSessions)
        .set({
          status: "graded",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(dictationSessions.id, sessionId));
    }

    return NextResponse.json({
      success: true,
      message:
        session[0].status === "in_progress"
          ? "已提交，等待家长批改"
          : ungradedCount === 0
          ? "批改已完成"
          : "批改已保存",
      data: {
        correctCount,
        totalCount,
        ungradedCount,
        status: nextStatus,
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
