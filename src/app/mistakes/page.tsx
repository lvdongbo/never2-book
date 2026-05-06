"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MistakeWithStats } from "@/types";

export default function MistakesListPage() {
  const [mistakes, setMistakes] = useState<MistakeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("全部");
  const [showMastered, setShowMastered] = useState(true);
  const [error, setError] = useState("");

  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mistakes");
      const data = await res.json();
      if (data.success) {
        setMistakes(data.data);
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
    fetchMistakes();
  }, []);

  const handleToggleMastered = async (mistake: MistakeWithStats) => {
    try {
      const res = await fetch(`/api/mistakes/${mistake.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMastered: !mistake.isMastered }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMistakes();
      }
    } catch {
      setError("操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这道错题吗？")) return;
    try {
      const res = await fetch(`/api/mistakes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchMistakes();
      }
    } catch {
      setError("删除失败");
    }
  };

  const filtered = mistakes.filter((m) => {
    if (subjectFilter !== "全部" && m.subject !== subjectFilter) return false;
    if (!showMastered && m.isMastered) return false;
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
          <h2 className="text-2xl font-bold text-gray-900">错题管理</h2>
          <p className="text-gray-500 mt-1">
            共 {mistakes.length} 道错题，{mistakes.filter((m) => m.isMastered).length} 道已过关
          </p>
        </div>
        <Link href="/mistakes/new" className="btn-primary mt-3 sm:mt-0 inline-flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>添加错题</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {["全部", "语文", "数学", "英语"].map((s) => (
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

      {/* Mistake list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">暂无错题记录</p>
          <Link href="/mistakes/new" className="btn-primary">
            添加第一道错题
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((mistake) => (
            <div key={mistake.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="badge-blue">{mistake.subject}</span>
                    {mistake.isMastered ? (
                      <span className="badge-green">已过关</span>
                    ) : (
                      <span className="badge-yellow">待过关</span>
                    )}
                  </div>

                  {/* Question preview */}
                  <div className="text-sm text-gray-900 line-clamp-2 mb-2">
                    {mistake.questionText || "（图片题）"}
                  </div>

                  {/* Images preview */}
                  {mistake.questionImages.length > 0 && (
                    <div className="flex space-x-2 mb-3">
                      {mistake.questionImages.slice(0, 3).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="题目图片"
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                        />
                      ))}
                      {mistake.questionImages.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                          +{mistake.questionImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>练习 {mistake.totalPractices} 次</span>
                    <span className="text-green-600">正确 {mistake.totalCorrect}</span>
                    <span className="text-red-600">错误 {mistake.totalWrong}</span>
                    <span>正确率 {mistake.correctRate}%</span>
                    {mistake.consecutiveCorrect > 0 && (
                      <span className="text-primary-600">
                        连续正确 {mistake.consecutiveCorrect}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-4">
                  <Link
                    href={`/mistakes/${mistake.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleToggleMastered(mistake)}
                    className={`p-2 rounded-lg transition-colors ${
                      mistake.isMastered
                        ? "text-green-500 hover:bg-green-50"
                        : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                    }`}
                    title={mistake.isMastered ? "恢复为待过关" : "标记为已过关"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(mistake.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
