"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PracticeSessionInfo {
  id: number;
  name: string;
  isRandom: number;
  status: string;
  totalItems: number;
  gradedItems: number;
  correctItems: number;
  createdAt: string;
}

export default function PracticeListPage() {
  const [sessions, setSessions] = useState<PracticeSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/practice")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "graded":
        return { text: "已批改", cls: "badge-green" };
      case "submitted":
        return { text: "待批改", cls: "badge-yellow" };
      default:
        return { text: "进行中", cls: "badge-blue" };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">错题练习</h2>
          <p className="text-gray-500 mt-1">
            共 {sessions.length} 次练习记录
          </p>
        </div>
        <Link
          href="/practice/new"
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
          <span>创建练习</span>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">暂无练习记录</p>
          <Link href="/practice/new" className="btn-primary">
            开始第一次练习
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const status = statusLabel(session.status);
            return (
              <Link
                key={session.id}
                href={
                  session.status === "in_progress"
                    ? `/practice/${session.id}`
                    : `/practice/${session.id}/grade`
                }
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {session.name}
                      </h3>
                      <span className={status.cls}>{status.text}</span>
                      {session.isRandom === 1 && (
                        <span className="badge bg-purple-100 text-purple-800">
                          随机
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{session.totalItems} 道题</span>
                      {session.gradedItems > 0 && (
                        <>
                          <span>
                            批改 {session.gradedItems}/{session.totalItems}
                          </span>
                          <span className="text-green-600">
                            正确 {session.correctItems}
                          </span>
                          {session.gradedItems > 0 && (
                            <span className="text-gray-400">
                              正确率{" "}
                              {Math.round(
                                (session.correctItems / session.gradedItems) *
                                  100
                              )}
                              %
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4"
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
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
