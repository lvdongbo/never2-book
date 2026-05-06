import { NextResponse } from "next/server";
import { db, mistakes, practiceSessionItems } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { deleteImage } from "@/lib/storage";

// GET - Get a single mistake by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const mistakeId = parseInt(id);

    const result = await db
      .select()
      .from(mistakes)
      .where(and(eq(mistakes.id, mistakeId), eq(mistakes.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "错题不存在" },
        { status: 404 }
      );
    }

    const mistake = result[0];
    return NextResponse.json({
      success: true,
      data: {
        ...mistake,
        questionImages: JSON.parse(mistake.questionImages || "[]"),
        explanationImages: JSON.parse(mistake.explanationImages || "[]"),
        isMastered: mistake.isMastered === 1,
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
      { success: false, message: "获取错题失败" },
      { status: 500 }
    );
  }
}

// PUT - Update a mistake
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const mistakeId = parseInt(id);

    // Check ownership
    const existing = await db
      .select({ id: mistakes.id, userId: mistakes.userId })
      .from(mistakes)
      .where(and(eq(mistakes.id, mistakeId), eq(mistakes.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "错题不存在" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.subject !== undefined) {
      if (!["语文", "数学", "英语"].includes(body.subject)) {
        return NextResponse.json(
          { success: false, message: "无效的科目" },
          { status: 400 }
        );
      }
      updateData.subject = body.subject;
    }
    if (body.questionText !== undefined)
      updateData.questionText = body.questionText;
    if (body.questionImages !== undefined)
      updateData.questionImages = JSON.stringify(body.questionImages);
    if (body.explanationText !== undefined)
      updateData.explanationText = body.explanationText;
    if (body.explanationImages !== undefined)
      updateData.explanationImages = JSON.stringify(body.explanationImages);
    if (body.isMastered !== undefined)
      updateData.isMastered = body.isMastered ? 1 : 0;

    await db
      .update(mistakes)
      .set(updateData)
      .where(eq(mistakes.id, mistakeId));

    return NextResponse.json({ success: true, message: "更新成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新错题失败" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a mistake
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const mistakeId = parseInt(id);

    // Get mistake to clean up images
    const existing = await db
      .select()
      .from(mistakes)
      .where(and(eq(mistakes.id, mistakeId), eq(mistakes.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "错题不存在" },
        { status: 404 }
      );
    }

    // Delete related practice session items first (foreign key constraint)
    await db
      .delete(practiceSessionItems)
      .where(eq(practiceSessionItems.mistakeId, mistakeId));

    // Clean up images
    const mistake = existing[0];
    const questionImages = JSON.parse(mistake.questionImages || "[]");
    const explanationImages = JSON.parse(mistake.explanationImages || "[]");
    const allImages = [...questionImages, ...explanationImages];
    for (const img of allImages) {
      await deleteImage(img).catch(() => {});
    }

    await db.delete(mistakes).where(eq(mistakes.id, mistakeId));

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "删除错题失败" },
      { status: 500 }
    );
  }
}
