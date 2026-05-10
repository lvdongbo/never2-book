import { NextResponse } from "next/server";
import {
  db,
  dictationSessions,
  dictationSessionItems,
  dictationWords,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// PUT - Submit answers and auto-grade (English only; Chinese skips auto-grade)
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

    if (session[0].status !== "in_progress") {
      return NextResponse.json(
        { success: false, message: "练习已提交，无法重复提交" },
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

    // Get all items with subject info for auto-grading decisions
    const items = await db
      .select({
        itemId: dictationSessionItems.id,
        expectedAnswer: dictationWords.expectedAnswer,
        subject: dictationWords.subject,
      })
      .from(dictationSessionItems)
      .innerJoin(
        dictationWords,
        eq(dictationSessionItems.dictationWordId, dictationWords.id)
      )
      .where(eq(dictationSessionItems.sessionId, sessionId)) as { itemId: number; expectedAnswer: string; subject: string }[];

    const itemMap = new Map(
      items.map((item) => [item.itemId, item])
    );

    let correctCount = 0;
    let totalGraded = 0;

    // Grade each answer
    for (const [itemIdStr, userAnswer] of Object.entries(answers)) {
      const itemId = parseInt(itemIdStr);
      const item = itemMap.get(itemId);

      if (!item) continue;

      const answerStr = String(userAnswer);

      if (item.subject === "语文") {
        // Chinese: handwriting canvas - store image, skip auto-grade
        await db
          .update(dictationSessionItems)
          .set({
            userAnswer: answerStr,
            isCorrect: null, // ungraded, needs manual review
          })
          .where(
            and(
              eq(dictationSessionItems.id, itemId),
              eq(dictationSessionItems.sessionId, sessionId)
            )
          );
      } else {
        // English: auto-grade by string comparison
        totalGraded++;
        const isCorrect =
          answerStr.trim().toLowerCase() ===
          item.expectedAnswer.trim().toLowerCase()
            ? 1
            : 0;
        if (isCorrect) correctCount++;

        await db
          .update(dictationSessionItems)
          .set({
            userAnswer: answerStr,
            isCorrect,
          })
          .where(
            and(
              eq(dictationSessionItems.id, itemId),
              eq(dictationSessionItems.sessionId, sessionId)
            )
          );
      }
    }

    // Update session status to submitted
    await db
      .update(dictationSessions)
      .set({
        status: "submitted",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dictationSessions.id, sessionId));

    // Count ungraded items (Chinese)
    const ungradedItems = await db
      .select({ id: dictationSessionItems.id })
      .from(dictationSessionItems)
      .where(
        and(
          eq(dictationSessionItems.sessionId, sessionId),
          eq(dictationSessionItems.isCorrect, null as unknown as number)
        )
      );
    const ungradedCount = ungradedItems.length;

    return NextResponse.json({
      success: true,
      message: `提交完成！自动批改正确 ${correctCount} / ${totalGraded}，${ungradedCount} 道手写题待批改`,
      data: {
        correctCount,
        totalCount: items.length,
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
