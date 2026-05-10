import { NextResponse } from "next/server";
import { db, units } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { SEMESTERS } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const unitId = parseInt(id);
    const body = await request.json();

    const existing = await db
      .select()
      .from(units)
      .where(and(eq(units.id, unitId), eq(units.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "单元不存在" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.gradeId !== undefined) updates.gradeId = body.gradeId;
    if (body.subjectId !== undefined) updates.subjectId = body.subjectId;
    if (body.semester && SEMESTERS.includes(body.semester)) updates.semester = body.semester;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    await db.update(units).set(updates).where(eq(units.id, unitId));

    return NextResponse.json({ success: true, message: "更新成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "更新单元失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const unitId = parseInt(id);

    const existing = await db
      .select()
      .from(units)
      .where(and(eq(units.id, unitId), eq(units.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "单元不存在" }, { status: 404 });
    }

    await db.delete(units).where(eq(units.id, unitId));

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "删除单元失败" }, { status: 500 });
  }
}
