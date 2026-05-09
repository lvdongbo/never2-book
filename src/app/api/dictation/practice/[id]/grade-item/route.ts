import { NextResponse } from "next/server";
import { db, dictationSessions, dictationSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Manually grade a single dictation session item (for handwriting)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sessionId = parseInt(id);

    // Check session ownership
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

    const { itemId, isCorrect } = await request.json();

    if (itemId === undefined || isCorrect === undefined) {
      return NextResponse.json(
        { success: false, message: "请提供批改结果" },
        { status: 400 }
      );
    }

    // Verify the item belongs to this session
    const item = await db
      .select({ id: dictationSessionItems.id })
      .from(dictationSessionItems)
      .where(
        and(
          eq(dictationSessionItems.id, itemId),
          eq(dictationSessionItems.sessionId, sessionId)
        )
      )
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json(
        { success: false, message: "题目不存在" },
        { status: 404 }
      );
    }

    await db
      .update(dictationSessionItems)
      .set({ isCorrect: isCorrect ? 1 : 0 })
      .where(eq(dictationSessionItems.id, itemId));

    return NextResponse.json({ success: true, message: "批改完成" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Grade item error:", error);
    return NextResponse.json(
      { success: false, message: "批改失败" },
      { status: 500 }
    );
  }
}
