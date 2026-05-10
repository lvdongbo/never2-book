import { NextResponse } from "next/server";
import { db, users, grades } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { SEMESTERS } from "@/types";

export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await db
      .select({
        currentGradeId: users.currentGradeId,
        currentSemester: users.currentSemester,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: rows[0] || { currentGradeId: null, currentSemester: null },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "获取个人设置失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const currentGradeIdRaw = body.currentGradeId;
    const currentSemesterRaw = body.currentSemester;

    const currentGradeId =
      currentGradeIdRaw === null || currentGradeIdRaw === undefined || currentGradeIdRaw === ""
        ? null
        : Number(currentGradeIdRaw);

    if (currentGradeId !== null) {
      if (!Number.isInteger(currentGradeId) || currentGradeId <= 0) {
        return NextResponse.json(
          { success: false, message: "年级设置不合法" },
          { status: 400 }
        );
      }

      const gradeRows = await db
        .select({ id: grades.id })
        .from(grades)
        .where(and(eq(grades.id, currentGradeId), eq(grades.userId, user.id)))
        .limit(1);

      if (gradeRows.length === 0) {
        return NextResponse.json(
          { success: false, message: "请选择有效的年级" },
          { status: 400 }
        );
      }
    }

    const currentSemester =
      currentSemesterRaw === null || currentSemesterRaw === undefined || currentSemesterRaw === ""
        ? null
        : String(currentSemesterRaw);

    if (currentSemester !== null && !SEMESTERS.includes(currentSemester as (typeof SEMESTERS)[number])) {
      return NextResponse.json(
        { success: false, message: "学期设置不合法" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        currentGradeId,
        currentSemester,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "个人设置已保存",
      data: { currentGradeId, currentSemester },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "保存个人设置失败" },
      { status: 500 }
    );
  }
}
