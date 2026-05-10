import { NextResponse } from "next/server";
import { db, grades } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { seedDefaultGrades } from "@/lib/seed-reference-data";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireAuth();
    await seedDefaultGrades(user.id);

    const rows = await db
      .select()
      .from(grades)
      .where(eq(grades.userId, user.id))
      .orderBy(grades.sortOrder, grades.id);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "获取年级列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, message: "请输入年级名称" }, { status: 400 });
    }

    const result = await db
      .insert(grades)
      .values({ userId: user.id, name: body.name.trim(), sortOrder: body.sortOrder ?? 0 })
      .returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "添加年级失败" }, { status: 500 });
  }
}
