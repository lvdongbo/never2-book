import { NextResponse } from "next/server";
import { db, practiceSessions, practiceSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Grade practice items (parent grading)
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

    if (session[0].status !== "submitted") {
      return NextResponse.json(
        { success: false, message: "练习尚未提交，无法批改" },
        { status: 400 }
      );
    }

    const { grades } = await request.json();

    if (!grades || typeof grades !== "object") {
      return NextResponse.json(
        { success: false, message: "请提供批改结果" },
        { status: 400 }
      );
    }

    // Update each grade
    for (const [itemIdStr, isCorrect] of Object.entries(grades)) {
      const itemId = parseInt(itemIdStr);
      await db
        .update(practiceSessionItems)
        .set({
          isCorrect: isCorrect ? 1 : 0,
        })
        .where(
          and(
            eq(practiceSessionItems.id, itemId),
            eq(practiceSessionItems.sessionId, sessionId)
          )
        );
    }

    // Update session status to graded
    await db
      .update(practiceSessions)
      .set({
        status: "graded",
        gradedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(practiceSessions.id, sessionId));

    return NextResponse.json({ success: true, message: "批改完成" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "批改失败" },
      { status: 500 }
    );
  }
}
