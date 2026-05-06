import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "请选择要上传的图片" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "不支持的图片格式，请上传 JPG/PNG/GIF/WebP 图片",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "图片大小不能超过 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveImage(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      data: { url },
      message: "上传成功",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "上传失败" },
      { status: 500 }
    );
  }
}
