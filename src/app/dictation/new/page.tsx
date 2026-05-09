"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DictationForm from "@/components/dictation/DictationForm";
import { DICTATION_SUBJECTS } from "@/types";
import type { CreateDictationWordInput, DictationSubject } from "@/types";

type Mode = "single" | "batch";

const BATCH_HINTS: Record<DictationSubject, string> = {
  语文: "每行一个词，拼音和中文用 Tab 键分隔：\nbo lan zhuang kuo\t波澜壮阔\njing tao hai lang\t惊涛骇浪",
  英语: "每行一个词，中文释义和英文用 Tab 键分隔：\n美丽的\tbeautiful\n苹果\tapple",
};

interface ParsedEntry {
  prompt: string;
  answer: string;
}

function parseBatch(text: string): ParsedEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const tabIdx = line.indexOf("\t");
      if (tabIdx === -1) {
        // No tab: treat the whole line as answer, empty prompt
        return { prompt: "", answer: line };
      }
      return {
        prompt: line.slice(0, tabIdx).trim(),
        answer: line.slice(tabIdx + 1).trim(),
      };
    })
    .filter((e) => e.answer.length > 0);
}

export default function NewDictationWordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("single");

  useEffect(() => {
    if (searchParams.get("mode") === "batch") {
      setMode("batch");
    }
  }, [searchParams]);
  const [batchSubject, setBatchSubject] = useState<DictationSubject>("语文");
  const [batchText, setBatchText] = useState("");
  const [batchTags, setBatchTags] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState("");

  const parsed = useMemo(() => parseBatch(batchText), [batchText]);
  const validEntries = parsed.filter((e) => e.prompt.length > 0);

  const handleSingleSubmit = async (data: CreateDictationWordInput) => {
    const res = await fetch("/api/dictation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    router.push("/dictation");
  };

  const handleBatchSubmit = async () => {
    if (validEntries.length === 0) {
      setBatchError("请按格式输入内容（每行用 Tab 分隔提示和答案）");
      return;
    }

    setBatchSubmitting(true);
    setBatchError("");

    try {
      const res = await fetch("/api/dictation/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: batchSubject,
          entries: validEntries.map((e) => ({
            prompt: e.prompt,
            answer: e.answer,
          })),
          tags: batchTags
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        }),
      });
      const result = await res.json();
      if (result.success) {
        router.push("/dictation");
      } else {
        setBatchError(result.message);
      }
    } catch {
      setBatchError("提交失败");
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">添加默写词</h2>

      {/* Mode toggle */}
      <div className="flex space-x-2 mb-6">
        {(
          [
            ["single", "单个添加"],
            ["batch", "批量添加"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <DictationForm onSubmit={handleSingleSubmit} submitLabel="添加默写词" />
      ) : (
        <div className="space-y-6">
          {/* Subject */}
          <div>
            <label className="label">科目</label>
            <div className="flex space-x-2">
              {DICTATION_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setBatchSubject(s);
                    setBatchText("");
                    setBatchError("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    batchSubject === s
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="label">批量粘贴</label>
            <p className="text-xs text-gray-400 mb-2 whitespace-pre-line">
              {BATCH_HINTS[batchSubject]}
            </p>
            <textarea
              className="input-field min-h-[180px] resize-y font-mono text-sm"
              value={batchText}
              onChange={(e) => {
                setBatchText(e.target.value);
                setBatchError("");
              }}
              placeholder={
                batchSubject === "语文"
                  ? "bo lan zhuang kuo\t波澜壮阔\njing tao hai lang\t惊涛骇浪"
                  : "美丽的\tbeautiful\n苹果\tapple"
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              已识别 {parsed.length} 行，
              {validEntries.length > 0 && (
                <span className="text-green-600">
                  {validEntries.length} 条有效（有提示 + 有答案）
                </span>
              )}
              {parsed.length - validEntries.length > 0 && (
                <span className="text-yellow-600">
                  ，{parsed.length - validEntries.length} 条缺少提示
                </span>
              )}
            </p>
          </div>

          {/* Common tags for batch */}
          <div>
            <label className="label">公共标签</label>
            <p className="text-xs text-gray-400 mb-1">
              可选，这些标签会应用到所有批量添加的单词上，逗号分隔
            </p>
            <input
              type="text"
              className="input-field"
              placeholder="例如：三年级上, 易错"
              value={batchTags}
              onChange={(e) => setBatchTags(e.target.value)}
            />
          </div>

          {/* Preview */}
          {validEntries.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                预览（共 {validEntries.length} 条）
              </h3>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-3 font-medium">
                        {batchSubject === "语文" ? "拼音" : "中文释义"}
                      </th>
                      <th className="pb-2 font-medium">
                        {batchSubject === "语文" ? "中文词语" : "英文单词"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {validEntries.map((e, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-3 text-gray-500">{e.prompt}</td>
                        <td className="py-1.5 font-medium text-gray-900">
                          {e.answer}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error */}
          {batchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {batchError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBatchSubmit}
              className="btn-primary"
              disabled={batchSubmitting || validEntries.length === 0}
            >
              {batchSubmitting
                ? "提交中..."
                : `批量添加（${validEntries.length} 条）`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
