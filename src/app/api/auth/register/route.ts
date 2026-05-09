import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "密码至少6位" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "该邮箱已注册" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        nickname: nickname || email.split("@")[0],
      })
      .returning({ id: users.id });

    const userId = result[0].id;
    const token = await createToken(userId);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        nickname: nickname || email.split("@")[0],
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "注册失败，请重试" },
      { status: 500 }
    );
  }
}
