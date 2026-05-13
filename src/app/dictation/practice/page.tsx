"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SessionWithCount {
  id: number;
  name: string;
  isRandom: number;
  status: string;
  totalItems: number;
  gradedItems: number;
  ungradedItems: number;
  correctItems: number;
  createdAt: string;
}

export default function DictationPracticeListPage() {
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dictation/practice");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定要删除这次练习记录吗？")) return;
    try {
      const res = await fetch(`/api/dictation/practice/${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      } else {
        setError(data.message);
      }
    } catch {
      setError("删除失败");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">默写练习</h2>
          <p className="text-gray-500 mt-1">
            共 {sessions.length} 次练习记录
          </p>
        </div>
        <Link
          href="/dictation/practice/new"
          className="btn-primary mt-3 sm:mt-0 inline-flex items-center space-x-1"
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
          <span>开始默写</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">暂无默写练习记录</p>
          <Link href="/dictation/practice/new" className="btn-primary">
            开始第一次默写
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="card hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <Link
                href={`/dictation/practice/${session.id}`}
                className="flex-1 min-w-0 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {session.name}
                    </span>
                    {session.isRandom === 1 && (
                      <span className="badge-blue text-xs">随机</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === "graded"
                          ? "bg-blue-100 text-blue-700"
                          : session.status === "submitted"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {session.status === "graded"
                        ? "已批改"
                        : session.status === "submitted"
                        ? "待批改"
                        : "进行中"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.status === "in_progress"
                      ? `${session.totalItems} 个词待默写`
                      : session.status === "graded"
                      ? `已批改 ${session.gradedItems}/${session.totalItems}，正确 ${session.correctItems}`
                      : `待批改 ${session.ungradedItems} 题`}
                    {" · "}
                    {new Date(session.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <button
                onClick={(e) => handleDelete(session.id, e)}
                className="ml-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
