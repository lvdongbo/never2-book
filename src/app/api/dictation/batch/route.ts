import { NextResponse } from "next/server";
import { db, dictationWords } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface BatchEntry {
  prompt: string;
  answer: string;
  notes?: string;
  tags?: string[];
}

// POST - Batch create dictation words
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { subject, entries, tags } = body as {
      subject: string;
      entries: BatchEntry[];
      tags?: string[];
    };

    if (!subject || !["语文", "英语"].includes(subject)) {
      return NextResponse.json(
        { success: false, message: "请选择有效的科目" },
        { status: 400 }
      );
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { success: false, message: "请至少输入一个默写词" },
        { status: 400 }
      );
    }

    const globalTagsJson = JSON.stringify(tags || []);

    // Filter out empty entries and validate
    const valid = entries.filter((e) => e.prompt.trim() && e.answer.trim());

    if (valid.length === 0) {
      return NextResponse.json(
        { success: false, message: "没有有效的默写词（每行需要同时有提示和答案）" },
        { status: 400 }
      );
    }

    // Batch insert with per-entry tags support
    const globalTagsArray: string[] = tags || [];

    await db.insert(dictationWords).values(
      valid.map((e) => {
        // Merge per-entry tags with global tags
        const entryTags = e.tags && e.tags.length > 0 ? e.tags : [];
        const mergedTags = [...new Set([...globalTagsArray, ...entryTags])];
        return {
          userId: user.id,
          subject,
          word: e.answer.trim(),
          prompt: e.prompt.trim(),
          expectedAnswer: e.answer.trim(),
          wrongAnswer: "",
          notes: e.notes?.trim() || "",
          tags: JSON.stringify(mergedTags),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { count: valid.length },
      message: `成功添加 ${valid.length} 个默写词`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }
    console.error("Batch create dictation words error:", error);
    return NextResponse.json(
      { success: false, message: "批量添加失败" },
      { status: 500 }
    );
  }
}
