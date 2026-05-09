import { NextResponse } from "next/server";
import {
  db,
  dictationSessions,
  dictationSessionItems,
  dictationWords,
} from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET - Get dictation session with items and words
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

    const items = await db
      .select({
        itemId: dictationSessionItems.id,
        sessionId: dictationSessionItems.sessionId,
        dictationWordId: dictationSessionItems.dictationWordId,
        userAnswer: dictationSessionItems.userAnswer,
        isCorrect: dictationSessionItems.isCorrect,
        itemCreatedAt: dictationSessionItems.createdAt,
        wordId: dictationWords.id,
        wordSubject: dictationWords.subject,
        wordText: dictationWords.word,
        wordPrompt: dictationWords.prompt,
        wordExpectedAnswer: dictationWords.expectedAnswer,
        wordNotes: dictationWords.notes,
      })
      .from(dictationSessionItems)
      .innerJoin(
        dictationWords,
        eq(dictationSessionItems.dictationWordId, dictationWords.id)
      )
      .where(eq(dictationSessionItems.sessionId, sessionId));

    const formattedItems = items.map((item) => ({
      id: item.itemId,
      sessionId: item.sessionId,
      dictationWordId: item.dictationWordId,
      userAnswer: item.userAnswer,
      isCorrect: item.isCorrect,
      createdAt: item.itemCreatedAt,
      word: {
        id: item.wordId,
        subject: item.wordSubject,
        word: item.wordText,
        prompt: item.wordPrompt,
        expectedAnswer: item.wordExpectedAnswer,
        notes: item.wordNotes,
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

// DELETE - Delete a dictation practice session
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sessionId = parseInt(id);

    const rows = await db
      .select({ id: dictationSessions.id })
      .from(dictationSessions)
      .where(
        and(
          eq(dictationSessions.id, sessionId),
          eq(dictationSessions.userId, user.id)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "练习不存在" },
        { status: 404 }
      );
    }

    await db.delete(dictationSessions).where(eq(dictationSessions.id, sessionId));

    return NextResponse.json({ success: true, message: "练习已删除" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Delete dictation session error:", error);
    return NextResponse.json(
      { success: false, message: "删除练习失败" },
      { status: 500 }
    );
  }
}
