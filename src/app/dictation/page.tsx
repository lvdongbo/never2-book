"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { DictationWordWithStats } from "@/types";

export default function DictationListPage() {
  const [words, setWords] = useState<DictationWordWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("全部");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showMastered, setShowMastered] = useState(true);
  const [error, setError] = useState("");

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dictation");
      const data = await res.json();
      if (data.success) {
        setWords(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // Collect all unique tags from all words
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    words.forEach((w) => w.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [words]);

  const handleToggleMastered = async (word: DictationWordWithStats) => {
    try {
      const res = await fetch(`/api/dictation/${word.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMastered: !word.isMastered }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWords();
      }
    } catch {
      setError("操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个默写词吗？")) return;
    try {
      const res = await fetch(`/api/dictation/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchWords();
      }
    } catch {
      setError("删除失败");
    }
  };

  const filtered = words.filter((w) => {
    if (subjectFilter !== "全部" && w.subject !== subjectFilter) return false;
    if (tagFilter && !w.tags?.includes(tagFilter)) return false;
    if (!showMastered && w.isMastered) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">单词管理</h2>
          <p className="text-gray-500 mt-1">
            共 {words.length} 个单词，{words.filter((w) => w.isMastered).length}{" "}
            个已过关
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <Link
            href="/dictation/new"
            className="btn-primary inline-flex items-center space-x-1"
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
            <span>添加</span>
          </Link>
          <Link
            href="/dictation/new?mode=batch"
            className="btn-secondary inline-flex items-center space-x-1"
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>批量添加</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {["全部", "语文", "英语"].map((s) => (
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

          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showMastered}
              onChange={(e) => setShowMastered(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>显示已过关</span>
          </label>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-400 mr-1">标签：</span>
            {tagFilter && (
              <button
                onClick={() => setTagFilter("")}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
              >
                <span>{tagFilter}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {allTags
              .filter((t) => t !== tagFilter)
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Word list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">暂无匹配的单词</p>
          <Link href="/dictation/new" className="btn-primary">
            添加第一个单词
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((word) => (
            <div
              key={word.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="badge-blue">{word.subject}</span>
                    {word.isMastered ? (
                      <span className="badge-green">已过关</span>
                    ) : (
                      <span className="badge-yellow">待过关</span>
                    )}
                  </div>

                  {/* Word card */}
                  <div className="mb-2">
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                      <span className="text-xs text-gray-400">看</span>
                      <span className="text-sm text-gray-600 font-medium">
                        {word.prompt || "（未设置）"}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className="text-xs text-gray-400">写</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {word.expectedAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {word.tags && word.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {word.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag)}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                            tagFilter === tag
                              ? "bg-purple-100 text-purple-700"
                              : "bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-700"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {word.notes && (
                    <div className="text-xs text-gray-400 mb-2 line-clamp-1">
                      {word.notes}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>练习 {word.totalPractices} 次</span>
                    <span className="text-green-600">
                      正确 {word.totalCorrect}
                    </span>
                    <span className="text-red-600">
                      错误 {word.totalWrong}
                    </span>
                    <span>正确率 {word.correctRate}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-4">
                  <Link
                    href={`/dictation/${word.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleToggleMastered(word)}
                    className={`p-2 rounded-lg transition-colors ${
                      word.isMastered
                        ? "text-green-500 hover:bg-green-50"
                        : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                    }`}
                    title={
                      word.isMastered ? "恢复为待过关" : "标记为已过关"
                    }
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(word.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
