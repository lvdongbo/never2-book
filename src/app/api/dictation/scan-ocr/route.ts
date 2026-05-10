import { NextResponse } from "next/server";
import { db, subjects } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const API_KEY = process.env.LLM_API_KEY || "";
const BASE_URL = process.env.LLM_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const MODEL = process.env.LLM_MODEL || "qwen-vl-plus";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message:
            "未配置 LLM API Key。请在环境变量中设置 LLM_API_KEY，或参考 README 配置 LLM_BASE_URL 和 LLM_MODEL",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    let subject = (formData.get("subject") as string) || "语文";
    const subjectIdStr = formData.get("subjectId") as string;
    if (subjectIdStr) {
      const rows = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(and(eq(subjects.id, parseInt(subjectIdStr)), eq(subjects.userId, user.id)))
        .limit(1);
      if (rows.length > 0) subject = rows[0].name;
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "请选择图片" },
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
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "图片大小不能超过 10MB" },
        { status: 400 }
      );
    }

    // Convert image to base64 for the LLM API call
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Prompt varies by subject
    const systemPrompt =
      subject === "英语"
        ? `你是一个精确的中英文识别工具。你的任务是识别图片中每个单词（包括词组和句子）的中文和英文，不漏掉任何单词。

每个单词请严格按照以下 JSON 格式输出
{
    "english": "xxx",  // 识别出的英文单词、词组或句子
    "chinese": "xxx",  // 识别出的中文翻译
    "tag": "xxx"       // 可选值：单词/词组/句子
}
最终结果只输出 JSON 数组，不要额外文字，示例：
[ 
  { "english": "behind", "chinese": "在...后面","tag": "单词" },
  { "english": "great fun", "chinese": "非常有趣","tag": "词组" },
  { "english": "The planes go very far.", "chinese": "飞机飞得非常远。","tag": "句子" }
]`

        : `你是一个精确的语文课本文字识别工具。你的任务是逐字识别图片中的拼音和汉字，不漏掉任何文字。

请严格按照以下 JSON 格式输出（只输出 JSON 数组，不要额外文字）：
[ { "pinyin": "bō lán zhuàng kuò", "hanzi": "波澜壮阔" }]`;

    const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } }
            ],
          },
        ],
        max_tokens: 8192,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM Vision API error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `识别服务调用失败（${response.status}），请检查 LLM_API_KEY 和 LLM_BASE_URL 配置是否正确`,
        },
        { status: 502 }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, message: "识别服务返回为空，请重试" },
        { status: 502 }
      );
    }

    // Try to extract JSON array from the response
    // The LLM may wrap it in markdown code blocks or include extra text
    let entries: Array<{ prompt: string; answer: string }> = [];

    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          entries = parsed
            .filter((e: any) => {
              const answer = e.english || e.hanzi || e.answer || "";
              return String(answer).trim();
            })
            .map((e: any) => ({
              prompt: (e.chinese || e.pinyin || e.prompt || "").trim(),
              answer: String(e.english || e.hanzi || e.answer || "").trim(),
            }));
        }
      } catch {
        // JSON parse failed, fall through to raw text
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        entries,
        rawText: content,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Scan OCR error:", error);
    return NextResponse.json(
      { success: false, message: "识别失败，请重试" },
      { status: 500 }
    );
  }
}
