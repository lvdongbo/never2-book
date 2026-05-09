import { NextResponse } from "next/server";
import { db, dictationWords, dictationSessionItems, dictationSessions } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET - Get single dictation word
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const wordId = parseInt(id);

    const rows = await db
      .select()
      .from(dictationWords)
      .where(
        and(eq(dictationWords.id, wordId), eq(dictationWords.userId, user.id))
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "默写词不存在" },
        { status: 404 }
      );
    }

    const word = {
      ...rows[0],
      isMastered: rows[0].isMastered === 1,
    };

    return NextResponse.json({ success: true, data: word });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "获取默写词失败" },
      { status: 500 }
    );
  }
}

// PUT - Update a dictation word
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const wordId = parseInt(id);

    // Verify ownership
    const rows = await db
      .select({ id: dictationWords.id })
      .from(dictationWords)
      .where(
        and(eq(dictationWords.id, wordId), eq(dictationWords.userId, user.id))
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "默写词不存在" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.subject !== undefined) {
      if (!["语文", "英语"].includes(body.subject)) {
        return NextResponse.json(
          { success: false, message: "无效的科目" },
          { status: 400 }
        );
      }
      updates.subject = body.subject;
    }
    if (body.word !== undefined) updates.word = body.word.trim();
    if (body.prompt !== undefined) updates.prompt = body.prompt;
    if (body.expectedAnswer !== undefined)
      updates.expectedAnswer = body.expectedAnswer.trim();
    if (body.wrongAnswer !== undefined) updates.wrongAnswer = body.wrongAnswer;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined)
      updates.tags = JSON.stringify(body.tags);
    if (body.isMastered !== undefined)
      updates.isMastered = body.isMastered ? 1 : 0;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db
        .update(dictationWords)
        .set(updates)
        .where(eq(dictationWords.id, wordId));
    }

    return NextResponse.json({ success: true, message: "更新成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Update dictation word error:", error);
    return NextResponse.json(
      { success: false, message: "更新默写词失败" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a dictation word
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const wordId = parseInt(id);

    // Verify ownership
    const rows = await db
      .select({ id: dictationWords.id })
      .from(dictationWords)
      .where(
        and(eq(dictationWords.id, wordId), eq(dictationWords.userId, user.id))
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "默写词不存在" },
        { status: 404 }
      );
    }

    await db.delete(dictationWords).where(eq(dictationWords.id, wordId));

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Delete dictation word error:", error);
    return NextResponse.json(
      { success: false, message: "删除默写词失败" },
      { status: 500 }
    );
  }
}
