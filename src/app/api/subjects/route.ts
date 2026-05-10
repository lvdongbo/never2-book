import { NextResponse } from "next/server";
import { db, subjects } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { seedDefaultSubjects } from "@/lib/seed-reference-data";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireAuth();
    await seedDefaultSubjects(user.id);

    const rows = await db
      .select()
      .from(subjects)
      .where(eq(subjects.userId, user.id))
      .orderBy(subjects.sortOrder, subjects.id);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "获取学科列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, message: "请输入学科名称" }, { status: 400 });
    }

    const result = await db
      .insert(subjects)
      .values({ userId: user.id, name: body.name.trim(), sortOrder: body.sortOrder ?? 0 })
      .returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "添加学科失败" }, { status: 500 });
  }
}
