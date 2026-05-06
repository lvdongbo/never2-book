import { NextResponse } from "next/server";
import { db, practiceSessions, practiceSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Submit answers for practice items
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
      .select({ id: practiceSessions.id, status: practiceSessions.status })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, user.id)
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
        { success: false, message: "练习已提交，无法修改" },
        { status: 400 }
      );
    }

    const { answers } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, message: "请提供答案" },
        { status: 400 }
      );
    }

    // Update each answer
    for (const [itemIdStr, userAnswer] of Object.entries(answers)) {
      const itemId = parseInt(itemIdStr);
      await db
        .update(practiceSessionItems)
        .set({ userAnswer: String(userAnswer) })
        .where(
          and(
            eq(practiceSessionItems.id, itemId),
            eq(practiceSessionItems.sessionId, sessionId)
          )
        );
    }

    // Update session status to submitted
    await db
      .update(practiceSessions)
      .set({ status: "submitted", updatedAt: new Date().toISOString() })
      .where(eq(practiceSessions.id, sessionId));

    return NextResponse.json({ success: true, message: "提交成功，等待批改" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "提交失败" },
      { status: 500 }
    );
  }
}
