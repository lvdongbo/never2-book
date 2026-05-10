import { NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, message: "请提供文字" }, { status: 400 });
    }

    const result = pinyin(text.trim(), {
      toneType: "symbol",
      type: "string",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Pinyin error:", error);
    return NextResponse.json({ success: false, message: "转换失败" }, { status: 500 });
  }
}
