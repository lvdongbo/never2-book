"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PracticeWord {
  id: number;
  dictationWordId: number;
  userAnswer: string;
  isCorrect: number | null;
  word: {
    id: number;
    subject: string;
    word: string;
    prompt: string;
    expectedAnswer: string;
    notes: string;
  };
}

interface SessionData {
  id: number;
  name: string;
  status: string;
  isRandom: number;
  items: PracticeWord[];
}

function buildSummary(
  items: PracticeWord[],
  manualGrades: Record<number, 0 | 1>
): { correctCount: number; totalCount: number; ungradedCount: number } {
  const totalCount = items.length;
  let correctCount = 0;
  let ungradedCount = 0;

  for (const item of items) {
    const grade = manualGrades[item.id] ?? item.isCorrect;
    if (grade === null) {
      ungradedCount += 1;
    } else if (grade === 1) {
      correctCount += 1;
    }
  }

  return { correctCount, totalCount, ungradedCount };
}

export default function DictationPracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");
  const [manualGrades, setManualGrades] = useState<Record<number, 0 | 1>>({});

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dictation/practice/${id}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        setManualGrades({});
      } else {
        setError(data.message);
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSubmit = async () => {
    if (!session) return;
    if (!confirm("确认已线下完成默写并提交给家长批改吗？")) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/dictation/practice/${id}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
      } else {
        setError(data.message);
      }
    } catch {
      setError("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualGrade = (itemId: number, isCorrect: boolean) => {
    if (!session) return;

    const item = session.items.find((current) => current.id === itemId);
    if (!item) return;

    const nextValue: 0 | 1 = isCorrect ? 1 : 0;

    setManualGrades((prev) => {
      const next = { ...prev };
      if (item.isCorrect === nextValue) {
        delete next[itemId];
      } else {
        next[itemId] = nextValue;
      }
      return next;
    });
  };

  const handleFinalizeManualGrades = async () => {
    if (!session || session.status === "in_progress") return;
    if (Object.keys(manualGrades).length === 0) return;

    setFinalizing(true);
    setError("");

    try {
      const res = await fetch(`/api/dictation/practice/${id}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualGrades }),
      });
      const data = await res.json();

      if (data.success) {
        setSession((prev) => {
          if (!prev) return prev;
          const nextStatus =
            data.data?.status === "graded" || data.data?.status === "submitted"
              ? data.data.status
              : prev.status;
          return {
            ...prev,
            status: nextStatus,
            items: prev.items.map((item) => {
              const grade = manualGrades[item.id];
              if (grade === undefined) return item;
              return { ...item, isCorrect: grade };
            }),
          };
        });
        setManualGrades({});
      } else {
        setError(data.message);
      }
    } catch {
      setError("批改提交失败");
    } finally {
      setFinalizing(false);
    }
  };

  const handleBackToList = () => {
    router.push("/dictation/practice");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">{error || "练习不存在"}</p>
        <Link href="/dictation/practice" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const isReviewMode = session.status !== "in_progress";
  const summary = isReviewMode ? buildSummary(session.items, manualGrades) : null;
  const hasPendingManualGrades = Object.keys(manualGrades).length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session.name}</h2>
            <p className="text-gray-500 mt-1">
              {isReviewMode
                ? `已提交 · 正确 ${summary?.correctCount ?? 0} / ${summary?.totalCount ?? 0}` +
                  (summary && summary.ungradedCount > 0
                    ? ` · ${summary.ungradedCount} 题待批改`
                    : "")
                : `共 ${session.items.length} 个默写词，线下完成后提交批改`}
            </p>
          </div>
          {isReviewMode && (
            <span className="badge-green text-sm">
              {session.status === "graded" ? "已批改" : "已提交"}
            </span>
          )}
        </div>

        {summary && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {summary.correctCount}
                <span className="text-lg text-gray-400">/{summary.totalCount}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">正确</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                {summary.totalCount - summary.correctCount - summary.ungradedCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">错误</div>
            </div>
            {summary.ungradedCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {summary.ungradedCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">待批改</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-700">
                {summary.totalCount > 0 && summary.ungradedCount < summary.totalCount
                  ? Math.round(
                      (summary.correctCount /
                        (summary.totalCount - summary.ungradedCount)) *
                        100
                    )
                  : "-"}
                {summary.ungradedCount < summary.totalCount ? "%" : ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.ungradedCount < summary.totalCount ? "正确率" : "等待批改"}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {session.items.map((item, index) => {
          const currentGrade = manualGrades[item.id] ?? item.isCorrect;

          return (
            <div
              key={item.id}
              className={`card ${
                isReviewMode && currentGrade !== null
                  ? currentGrade === 1
                    ? "border-l-4 border-l-green-400"
                    : "border-l-4 border-l-red-400"
                  : isReviewMode
                  ? "border-l-4 border-l-yellow-400"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                  <span className="badge-blue text-xs">{item.word.subject}</span>
                  {isReviewMode && currentGrade !== null && (
                    <span
                      className={`text-xs font-medium ${
                        currentGrade === 1 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {currentGrade === 1 ? "正确" : "错误"}
                    </span>
                  )}
                  {isReviewMode && currentGrade === null && (
                    <span className="text-xs font-medium text-yellow-600">待批改</span>
                  )}
                </div>
              </div>

              {isReviewMode ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {item.word.subject === "语文" ? "拼音" : "中文释义"}
                    </p>
                    <p className="text-lg text-gray-900 font-medium">
                      {item.word.prompt || "（未设置）"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">正确答案</p>
                    <p className="text-green-700 font-medium">{item.word.expectedAnswer}</p>
                  </div>

                  {item.userAnswer && (
                    <div>
                      <p className="text-sm text-gray-500">历史在线作答</p>
                      {item.userAnswer.startsWith("data:image") ? (
                        <img
                          src={item.userAnswer}
                          alt="历史作答"
                          className="max-w-full rounded border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-700">{item.userAnswer}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">批改：</span>
                    <button
                      onClick={() => handleManualGrade(item.id, true)}
                      disabled={finalizing}
                      className={`px-3 py-1 text-xs font-medium rounded border disabled:opacity-50 ${
                        currentGrade === 1
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      }`}
                    >
                      正确
                    </button>
                    <button
                      onClick={() => handleManualGrade(item.id, false)}
                      disabled={finalizing}
                      className={`px-3 py-1 text-xs font-medium rounded border disabled:opacity-50 ${
                        currentGrade === 0
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      }`}
                    >
                      错误
                    </button>
                  </div>

                  {item.word.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">记忆技巧：{item.word.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">
                    {item.word.subject === "语文" ? "当前拼音" : "当前中文释义"}
                  </p>
                  <p className="text-lg text-gray-900 font-medium">
                    {item.word.prompt || "（未设置）"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center space-x-3">
        {isReviewMode ? (
          <>
            <button onClick={handleBackToList} className="btn-primary">
              返回练习列表
            </button>
            <button
              onClick={handleFinalizeManualGrades}
              className="btn-secondary"
              disabled={!hasPendingManualGrades || finalizing}
            >
              {finalizing ? "提交中..." : "完成批改"}
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
              {submitting ? "提交中..." : "提交默写"}
            </button>
            <Link href="/dictation/practice" className="btn-secondary">
              取消
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
