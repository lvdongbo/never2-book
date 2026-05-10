import { NextResponse } from "next/server";
import { db, grades } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const gradeId = parseInt(id);
    const body = await request.json();

    const existing = await db
      .select()
      .from(grades)
      .where(and(eq(grades.id, gradeId), eq(grades.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "年级不存在" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    await db.update(grades).set(updates).where(eq(grades.id, gradeId));

    return NextResponse.json({ success: true, message: "更新成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "更新年级失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const gradeId = parseInt(id);

    const existing = await db
      .select()
      .from(grades)
      .where(and(eq(grades.id, gradeId), eq(grades.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "年级不存在" }, { status: 404 });
    }

    await db.delete(grades).where(eq(grades.id, gradeId));

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "删除年级失败" }, { status: 500 });
  }
}
