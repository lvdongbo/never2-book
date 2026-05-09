"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalMistakes: number;
  masteredMistakes: number;
  pendingMistakes: number;
  totalSessions: number;
  recentSessions: Array<{
    id: number;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
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

  const statCards = [
    {
      label: "错题总数",
      value: stats?.totalMistakes ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "待过关",
      value: stats?.pendingMistakes ?? 0,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "已过关",
      value: stats?.masteredMistakes ?? 0,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "练习次数",
      value: stats?.totalSessions ?? 0,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
        <p className="text-gray-500 mt-1">查看错题本的整体情况</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="card flex items-center space-x-4">
            <div className={`${card.bg} p-3 rounded-lg`}>
              <span className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </span>
            </div>
            <span className="text-sm text-gray-500">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/mistakes/new"
          className="card hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <svg
                className="w-5 h-5 text-primary-600"
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
            </div>
            <div>
              <h3 className="font-medium text-gray-900">添加错题</h3>
              <p className="text-sm text-gray-500">录入新的错题</p>
            </div>
          </div>
        </Link>

        <Link
          href="/practice/new"
          className="card hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">开始练习</h3>
              <p className="text-sm text-gray-500">创建练习并刷题</p>
            </div>
          </div>
        </Link>

        <Link
          href="/analytics"
          className="card hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">练习分析</h3>
              <p className="text-sm text-gray-500">查看练习数据统计</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent sessions */}
      {stats?.recentSessions && stats.recentSessions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            最近练习
          </h3>
          <div className="space-y-3">
            {stats.recentSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.name}
                  </p>
                  <p className="text-xs text-gray-400">{session.createdAt}</p>
                </div>
                <span
                  className={`badge text-xs ${
                    session.status === "graded"
                      ? "badge-green"
                      : session.status === "submitted"
                      ? "badge-yellow"
                      : "badge-blue"
                  }`}
                >
                  {session.status === "graded"
                    ? "已批改"
                    : session.status === "submitted"
                    ? "待批改"
                    : "进行中"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
