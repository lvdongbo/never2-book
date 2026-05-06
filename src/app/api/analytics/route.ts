import { NextResponse } from "next/server";
import {
  db,
  mistakes,
  practiceSessionItems,
  practiceSessions,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

// GET - Get analytics for all mistakes
export async function GET() {
  try {
    const user = await requireAuth();

    // Get mistake stats
    const rows = await db
      .select({
        mistakeId: mistakes.id,
        subject: mistakes.subject,
        questionText: mistakes.questionText,
        questionImages: mistakes.questionImages,
        isMastered: mistakes.isMastered,
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
    const statsWithConsecutive = await Promise.all(
      rows.map(async (row) => {
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
              eq(practiceSessionItems.mistakeId, row.mistakeId),
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

        const totalP = Number(row.totalPractices) || 0;
        const totalC = Number(row.totalCorrect) || 0;

        return {
          mistakeId: row.mistakeId,
          subject: row.subject,
          questionText: row.questionText,
          questionImages: JSON.parse(row.questionImages || "[]"),
          isMastered: row.isMastered === 1,
          totalPractices: totalP,
          totalCorrect: totalC,
          totalWrong: Number(row.totalWrong) || 0,
          consecutiveCorrect,
          correctRate: totalP > 0 ? Math.round((totalC / totalP) * 100) : 0,
        };
      })
    );

    // Overall summary
    const totalMistakes = rows.length;
    const masteredMistakes = rows.filter((r) => r.isMastered === 1).length;
    const pendingMistakes = totalMistakes - masteredMistakes;

    const sessions = await db
      .select({
        id: practiceSessions.id,
        name: practiceSessions.name,
        status: practiceSessions.status,
        createdAt: practiceSessions.createdAt,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, user.id))
      .orderBy(sql`${practiceSessions.createdAt} DESC`)
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalMistakes,
        masteredMistakes,
        pendingMistakes,
        totalSessions: await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(practiceSessions)
          .where(eq(practiceSessions.userId, user.id))
          .then((r) => r[0]?.count || 0),
        recentSessions: sessions,
        mistakeStats: statsWithConsecutive,
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
      { success: false, message: "获取分析数据失败" },
      { status: 500 }
    );
  }
}
