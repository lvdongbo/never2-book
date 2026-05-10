import { NextResponse } from "next/server";
import { db, units, grades, subjects } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { SEMESTERS } from "@/types";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId");
    const subjectId = searchParams.get("subjectId");
    const semester = searchParams.get("semester");

    const filters = [eq(units.userId, user.id)];

    if (gradeId) {
      filters.push(eq(units.gradeId, parseInt(gradeId)));
    }
    if (subjectId) {
      filters.push(eq(units.subjectId, parseInt(subjectId)));
    }
    if (semester && SEMESTERS.includes(semester as typeof SEMESTERS[number])) {
      filters.push(eq(units.semester, semester));
    }

    const query = db
      .select({
        id: units.id,
        userId: units.userId,
        gradeId: units.gradeId,
        subjectId: units.subjectId,
        name: units.name,
        semester: units.semester,
        sortOrder: units.sortOrder,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
        gradeName: grades.name,
        subjectName: subjects.name,
      })
      .from(units)
      .leftJoin(grades, eq(units.gradeId, grades.id))
      .leftJoin(subjects, eq(units.subjectId, subjects.id))
      .where(and(...filters));

    const rows = await query.orderBy(grades.sortOrder, subjects.sortOrder, units.sortOrder, units.id);

    const data = rows.map((r) => ({
      ...r,
      grade: { id: r.gradeId, name: r.gradeName },
      subjectEntity: { id: r.subjectId, name: r.subjectName },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "获取单元列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, message: "请输入单元名称" }, { status: 400 });
    }
    if (!body.gradeId) {
      return NextResponse.json({ success: false, message: "请选择年级" }, { status: 400 });
    }
    if (!body.subjectId) {
      return NextResponse.json({ success: false, message: "请选择学科" }, { status: 400 });
    }
    if (!body.semester || !SEMESTERS.includes(body.semester)) {
      return NextResponse.json({ success: false, message: "请选择学期" }, { status: 400 });
    }

    const result = await db
      .insert(units)
      .values({
        userId: user.id,
        gradeId: body.gradeId,
        subjectId: body.subjectId,
        name: body.name.trim(),
        semester: body.semester,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "添加单元失败" }, { status: 500 });
  }
}
