"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DICTATION_SUBJECTS } from "@/types";
import type { DictationSubject } from "@/types";

interface TableRow {
  id: string;
  prompt: string;
  answer: string;
  rowTags: string;
}

interface EntryTableProps {
  subject: DictationSubject;
  initialEntries?: Array<{ prompt: string; answer: string }>;
  onSubjectChange?: (s: DictationSubject) => void;
  showBack?: boolean;
  onBack?: () => void;
}

let rowCounter = 0;
function nextId() {
  return `row-${++rowCounter}`;
}

export default function EntryTable({
  subject: initialSubject,
  initialEntries = [],
  onSubjectChange,
  showBack = false,
  onBack,
}: EntryTableProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<DictationSubject>(initialSubject);
  const [rows, setRows] = useState<TableRow[]>(() =>
    initialEntries.length > 0
      ? initialEntries.map((e) => ({
          id: nextId(),
          prompt: e.prompt,
          answer: e.answer,
          rowTags: "",
        }))
      : []
  );
  const [globalTags, setGlobalTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const switchSubject = (s: DictationSubject) => {
    setSubject(s);
    setRows([]);
    setError("");
    onSubjectChange?.(s);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: nextId(), prompt: "", answer: "", rowTags: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (
    id: string,
    field: "prompt" | "answer" | "rowTags",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const validCount = rows.filter((r) => r.answer.trim()).length;

  const handleSave = async () => {
    if (validCount === 0) {
      setError("请至少添加一条有效数据");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const globalTagsList = globalTags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/dictation/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          entries: rows
            .filter((r) => r.answer.trim())
            .map((r) => ({
              prompt: r.prompt.trim(),
              answer: r.answer.trim(),
              tags: r.rowTags
                ? r.rowTags
                    .split(/[,，]/)
                    .map((t) => t.trim())
                    .filter(Boolean)
                : undefined,
            })),
          tags: globalTagsList,
        }),
      });

      const result = await res.json();
      if (result.success) {
        router.push("/dictation");
      } else {
        setError(result.message);
      }
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const [pinyinLoading, setPinyinLoading] = useState<Record<string, boolean>>({});

  const isEnglish = subject === "英语";
  const col1Label = isEnglish ? "英文" : "汉字";
  const col2Label = isEnglish ? "中文" : "拼音";
  const col1Placeholder = isEnglish ? "behind" : "波澜壮阔";
  const col2Placeholder = isEnglish ? "美丽的" : "bo lan zhuang kuo";

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="label">科目</label>
        <div className="flex space-x-2">
          {DICTATION_SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => switchSubject(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                subject === s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
              <th className="pb-2 pr-2 font-medium w-7">#</th>
              <th className="pb-2 pr-2 font-medium">{col1Label}</th>
              <th className="pb-2 pr-2 font-medium">{col2Label}</th>
              <th className="pb-2 pr-2 font-medium">标签</th>
              <th className="pb-2 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className="py-1.5 pr-2 text-gray-400 text-xs align-top pt-3">
                  {index + 1}
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="text"
                    className="input-field py-1.5 text-sm"
                    placeholder={col1Placeholder}
                    value={row.answer}
                    onChange={(e) => updateRow(row.id, "answer", e.target.value)}
                    onBlur={async (e) => {
                      if (isEnglish || !e.target.value.trim()) return;
                      const rowData = rows.find((r) => r.id === row.id);
                      if (rowData?.prompt.trim()) return;
                      setPinyinLoading((p) => ({ ...p, [row.id]: true }));
                      try {
                        const res = await fetch("/api/dictation/pinyin", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: e.target.value.trim() }),
                        });
                        const result = await res.json();
                        if (result.success && result.data) {
                          updateRow(row.id, "prompt", result.data);
                        }
                      } catch {} finally {
                        setPinyinLoading((p) => ({ ...p, [row.id]: false }));
                      }
                    }}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="input-field py-1.5 text-sm"
                      placeholder={col2Placeholder}
                      value={row.prompt}
                      onChange={(e) => updateRow(row.id, "prompt", e.target.value)}
                    />
                    {pinyinLoading[row.id] && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        转换中...
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="text"
                    className="input-field py-1.5 text-sm"
                    placeholder="可选"
                    value={row.rowTags}
                    onChange={(e) => updateRow(row.id, "rowTags", e.target.value)}
                  />
                </td>
                <td className="py-1.5 align-top pt-3">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <button
        onClick={addRow}
        className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>添加一行</span>
      </button>

      {/* Global tags */}
      <div>
        <label className="label">公共标签</label>
        <p className="text-xs text-gray-400 mb-1">
          应用到所有行，逗号分隔
        </p>
        <input
          type="text"
          className="input-field"
          placeholder="例如：三年级上, 第五单元"
          value={globalTags}
          onChange={(e) => setGlobalTags(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving || validCount === 0}
        >
          {saving ? "保存中..." : `批量添加（${validCount} 条）`}
        </button>
        {showBack && onBack && (
          <button onClick={onBack} className="btn-secondary" disabled={saving}>
            重新拍照
          </button>
        )}
      </div>
    </div>
  );
}
