"use client";

import { useEffect, useState } from "react";

interface MistakeStat {
  mistakeId: number;
  subject: string;
  questionText: string;
  questionImages: string[];
  isMastered: boolean;
  totalPractices: number;
  totalCorrect: number;
  totalWrong: number;
  consecutiveCorrect: number;
  correctRate: number;
}

interface AnalyticsData {
  totalMistakes: number;
  masteredMistakes: number;
  pendingMistakes: number;
  totalSessions: number;
  mistakeStats: MistakeStat[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("totalPractices");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [subjectFilter, setSubjectFilter] = useState<string>("全部");
  const [showMastered, setShowMastered] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
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

  if (!data) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">暂无数据</p>
      </div>
    );
  }

  // Filter and sort
  let stats = data.mistakeStats.filter((s) => {
    if (subjectFilter !== "全部" && s.subject !== subjectFilter) return false;
    if (!showMastered && s.isMastered) return false;
    return true;
  });

  stats.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    switch (sortBy) {
      case "totalPractices":
        valA = a.totalPractices;
        valB = b.totalPractices;
        break;
      case "totalCorrect":
        valA = a.totalCorrect;
        valB = b.totalCorrect;
        break;
      case "totalWrong":
        valA = a.totalWrong;
        valB = b.totalWrong;
        break;
      case "consecutiveCorrect":
        valA = a.consecutiveCorrect;
        valB = b.consecutiveCorrect;
        break;
      case "correctRate":
        valA = a.correctRate;
        valB = b.correctRate;
        break;
    }
    return sortDir === "desc" ? valB - valA : valA - valB;
  });

  const sortOptions = [
    { value: "totalPractices", label: "练习次数" },
    { value: "totalCorrect", label: "正确次数" },
    { value: "totalWrong", label: "错误次数" },
    { value: "consecutiveCorrect", label: "连续正确" },
    { value: "correctRate", label: "正确率" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">练习分析</h2>
        <p className="text-gray-500 mt-1">错题练习数据统计与分析</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "错题总数", value: data.totalMistakes, color: "text-blue-600" },
          { label: "待过关", value: data.pendingMistakes, color: "text-orange-600" },
          { label: "已过关", value: data.masteredMistakes, color: "text-green-600" },
          { label: "练习总次数", value: data.totalSessions, color: "text-purple-600" },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-3xl font-bold mb-1">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

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

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (sortBy === opt.value) {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortBy(opt.value);
                  setSortDir("desc");
                }
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {opt.label}
              {sortBy === opt.value && (
                <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
              )}
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

      {/* Stats table */}
      {stats.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">暂无练习数据</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  错题
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  科目
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  练习次数
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  正确次数
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  错误次数
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  正确率
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  连续正确
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr
                  key={stat.mistakeId}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <p className="text-gray-900 truncate">
                        {stat.questionText || "（图片题）"}
                      </p>
                      {stat.questionImages.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {stat.questionImages.length} 张图片
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="badge-blue text-xs">{stat.subject}</span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900 font-medium">
                    {stat.totalPractices}
                  </td>
                  <td className="text-center py-3 px-4 text-green-600 font-medium">
                    {stat.totalCorrect}
                  </td>
                  <td className="text-center py-3 px-4 text-red-600 font-medium">
                    {stat.totalWrong}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            stat.correctRate >= 80
                              ? "bg-green-500"
                              : stat.correctRate >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${stat.correctRate}%` }}
                        />
                      </div>
                      <span className="text-gray-700">{stat.correctRate}%</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`font-medium ${
                        stat.consecutiveCorrect >= 3
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {stat.consecutiveCorrect}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {stat.isMastered ? (
                      <span className="badge-green text-xs">已过关</span>
                    ) : (
                      <span className="badge-yellow text-xs">待过关</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
