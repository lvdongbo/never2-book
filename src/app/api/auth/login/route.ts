import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        nickname: users.nickname,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const user = result[0];
    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const token = await createToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "登录失败，请重试" },
      { status: 500 }
    );
  }
}
