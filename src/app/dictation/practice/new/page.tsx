"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DICTATION_SUBJECTS } from "@/types";
import type { DictationWordWithStats, DictationRandomRules } from "@/types";

export default function NewDictationPracticePage() {
  const router = useRouter();
  const [words, setWords] = useState<DictationWordWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"manual" | "random">("manual");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<string>("全部");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Random generation state
  const [randomCount, setRandomCount] = useState(10);
  const [randomOrderBy, setRandomOrderBy] =
    useState<DictationRandomRules["orderBy"]>("errors");
  const [randomOrderDir, setRandomOrderDir] =
    useState<DictationRandomRules["orderDir"]>("desc");
  const [randomSubject, setRandomSubject] = useState<string>("全部");

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dictation");
      const data = await res.json();
      if (data.success) {
        setWords(data.data.filter((w: DictationWordWithStats) => !w.isMastered));
      }
    } catch {
      setError("加载默写词失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const filtered = words.filter(
    (w) => subjectFilter === "全部" || w.subject === subjectFilter
  );

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((w) => w.id)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleManualCreate = async () => {
    if (selected.size === 0) {
      setError("请至少选择一个默写词");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/dictation/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `手动默写 ${new Date().toLocaleString("zh-CN")}`,
          wordIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dictation/practice/${data.data.id}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleRandomCreate = async () => {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/dictation/practice/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: randomCount,
          orderBy: randomOrderBy,
          orderDir: randomOrderDir,
          subject: randomSubject !== "全部" ? randomSubject : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dictation/practice/${data.data.id}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const pendingCount = words.length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">开始默写</h2>
        <p className="text-gray-500 mt-1">
          共 {pendingCount} 个待过关默写词可供练习
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Mode selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          手动选择
        </button>
        <button
          onClick={() => setMode("random")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "random"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          随机生成
        </button>
      </div>

      {mode === "manual" ? (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {["全部", ...DICTATION_SUBJECTS].map((s) => (
                <button
                  key={s}
                  onClick={() => setSubjectFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    subjectFilter === s
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                全选
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                清空
              </button>
            </div>
          </div>

          {/* Word selection */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">
                {words.length === 0
                  ? "所有默写词已过关！"
                  : "该科目没有待过关的默写词"}
              </p>
              <Link href="/dictation/new" className="btn-primary mt-4 inline-block">
                添加新默写词
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {filtered.map((word) => (
                <label
                  key={word.id}
                  className={`card flex items-start space-x-3 cursor-pointer transition-all ${
                    selected.has(word.id)
                      ? "ring-2 ring-primary-500 border-primary-500"
                      : "hover:shadow-md"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(word.id)}
                    onChange={() => toggleSelect(word.id)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="badge-blue text-xs">
                        {word.subject}
                      </span>
                    </div>
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 text-sm mb-1">
                      <span className="text-xs text-gray-400">看</span>
                      <span className="text-gray-500">{word.prompt || "（无）"}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-xs text-gray-400">写</span>
                      <span className="font-semibold text-gray-900">{word.expectedAnswer}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span>练习 {word.totalPractices} 次</span>
                      <span className="text-green-500">
                        正确 {word.totalCorrect}
                      </span>
                      <span className="text-red-500">
                        错误 {word.totalWrong}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <button
              onClick={handleManualCreate}
              className="btn-primary"
              disabled={creating || selected.size === 0}
            >
              {creating
                ? "创建中..."
                : `开始默写（已选 ${selected.size} 个词）`}
            </button>
          )}
        </>
      ) : (
        /* Random generation */
        <div className="card space-y-4">
          <div>
            <label className="label">默写词数量</label>
            <input
              type="number"
              value={randomCount}
              onChange={(e) =>
                setRandomCount(
                  Math.max(1, Math.min(50, parseInt(e.target.value) || 10))
                )
              }
              className="input-field w-32"
              min={1}
              max={50}
            />
          </div>

          <div>
            <label className="label">排序规则</label>
            <div className="flex space-x-2">
              {[
                { value: "errors", label: "按错误次数" },
                { value: "practices", label: "按练习次数" },
                { value: "random", label: "随机" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setRandomOrderBy(
                      opt.value as DictationRandomRules["orderBy"]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderBy === opt.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {randomOrderBy !== "random" && (
            <div>
              <label className="label">排序方向</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setRandomOrderDir("desc")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderDir === "desc"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  从高到低
                </button>
                <button
                  onClick={() => setRandomOrderDir("asc")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderDir === "asc"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  从低到高
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="label">科目筛选（可选）</label>
            <div className="flex space-x-2">
              {["全部", ...DICTATION_SUBJECTS].map((s) => (
                <button
                  key={s}
                  onClick={() => setRandomSubject(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomSubject === s
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRandomCreate}
            className="btn-primary"
            disabled={creating || pendingCount === 0}
          >
            {creating
              ? "生成中..."
              : `随机生成默写（从 ${pendingCount} 个词中抽取）`}
          </button>
        </div>
      )}
    </div>
  );
}
