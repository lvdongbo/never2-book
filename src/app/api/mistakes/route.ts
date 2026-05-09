import { NextResponse } from "next/server";
import { db, mistakes, practiceSessionItems, practiceSessions } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { CreateMistakeInput } from "@/types";

// GET - List all mistakes for the current user, with stats
export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await db
      .select({
        id: mistakes.id,
        userId: mistakes.userId,
        subject: mistakes.subject,
        questionText: mistakes.questionText,
        questionImages: mistakes.questionImages,
        explanationText: mistakes.explanationText,
        explanationImages: mistakes.explanationImages,
        isMastered: mistakes.isMastered,
        createdAt: mistakes.createdAt,
        updatedAt: mistakes.updatedAt,
        totalPractices: sql<number>`COUNT(DISTINCT ${practiceSessionItems.id})`,
        totalCorrect: sql<number>`SUM(CASE WHEN ${practiceSessionItems.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        totalWrong: sql<number>`SUM(CASE WHEN ${practiceSessionItems.isCorrect} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(mistakes)
      .leftJoin(
        practiceSessionItems,
        eq(mistakes.id, practiceSessionItems.mistakeId)
      )
      .where(eq(mistakes.userId, user.id))
      .groupBy(mistakes.id)
      .orderBy(sql`${mistakes.updatedAt} DESC`);

    // Calculate consecutive correct for each mistake
    const mistakesWithStats = await Promise.all(
      rows.map(async (row) => {
        // Get recent results in reverse chronological order for consecutive count
        const recentItems = await db
          .select({
            isCorrect: practiceSessionItems.isCorrect,
          })
          .from(practiceSessionItems)
          .innerJoin(
            practiceSessions,
            eq(practiceSessionItems.sessionId, practiceSessions.id)
          )
          .where(
            and(
              eq(practiceSessionItems.mistakeId, row.id),
              sql`${practiceSessionItems.isCorrect} IS NOT NULL`
            )
          )
          .orderBy(sql`${practiceSessions.createdAt} DESC`);

        let consecutiveCorrect = 0;
        for (const item of recentItems) {
          if (item.isCorrect === 1) {
            consecutiveCorrect++;
          } else {
            break;
          }
        }

        return {
          ...row,
          questionImages: JSON.parse(row.questionImages || "[]"),
          explanationImages: JSON.parse(row.explanationImages || "[]"),
          isMastered: row.isMastered === 1,
          totalPractices: Number(row.totalPractices) || 0,
          totalCorrect: Number(row.totalCorrect) || 0,
          totalWrong: Number(row.totalWrong) || 0,
          consecutiveCorrect,
          correctRate:
            Number(row.totalPractices) > 0
              ? Math.round(
                  ((Number(row.totalCorrect) || 0) /
                    Number(row.totalPractices)) *
                    100
                )
              : 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: mistakesWithStats });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("List mistakes error:", error);
    return NextResponse.json(
      { success: false, message: "获取错题列表失败" },
      { status: 500 }
    );
  }
}

// POST - Create a new mistake
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body: CreateMistakeInput = await request.json();

    if (!body.subject || !["语文", "数学", "英语"].includes(body.subject)) {
      return NextResponse.json(
        { success: false, message: "请选择有效的科目" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(mistakes)
      .values({
        userId: user.id,
        subject: body.subject,
        questionText: body.questionText || "",
        questionImages: JSON.stringify(body.questionImages || []),
        explanationText: body.explanationText || "",
        explanationImages: JSON.stringify(body.explanationImages || []),
      })
      .returning({ id: mistakes.id });

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
      message: "错题添加成功",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Create mistake error:", error);
    return NextResponse.json(
      { success: false, message: "添加错题失败" },
      { status: 500 }
    );
  }
}
