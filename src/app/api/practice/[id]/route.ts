import { NextResponse } from "next/server";
import {
  db,
  practiceSessions,
  practiceSessionItems,
  mistakes,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET - Get practice session with items and mistakes
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sessionId = parseInt(id);

    const session = await db
      .select()
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

    const items = await db
      .select({
        itemId: practiceSessionItems.id,
        sessionId: practiceSessionItems.sessionId,
        mistakeId: practiceSessionItems.mistakeId,
        userAnswer: practiceSessionItems.userAnswer,
        isCorrect: practiceSessionItems.isCorrect,
        itemCreatedAt: practiceSessionItems.createdAt,
        mistakeSubject: mistakes.subject,
        mistakeQuestionText: mistakes.questionText,
        mistakeQuestionImages: mistakes.questionImages,
        mistakeExplanationText: mistakes.explanationText,
        mistakeExplanationImages: mistakes.explanationImages,
      })
      .from(practiceSessionItems)
      .innerJoin(
        mistakes,
        eq(practiceSessionItems.mistakeId, mistakes.id)
      )
      .where(eq(practiceSessionItems.sessionId, sessionId));

    const formattedItems = items.map((item) => ({
      id: item.itemId,
      sessionId: item.sessionId,
      mistakeId: item.mistakeId,
      userAnswer: item.userAnswer,
      isCorrect: item.isCorrect,
      createdAt: item.itemCreatedAt,
      mistake: {
        id: item.mistakeId,
        subject: item.mistakeSubject,
        questionText: item.mistakeQuestionText,
        questionImages: JSON.parse(item.mistakeQuestionImages || "[]"),
        explanationText: item.mistakeExplanationText,
        explanationImages: JSON.parse(item.mistakeExplanationImages || "[]"),
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...session[0],
        randomRules: session[0].randomRules
          ? JSON.parse(session[0].randomRules)
          : null,
        items: formattedItems,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "获取练习详情失败" },
      { status: 500 }
    );
  }
}
