"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HandwritingCanvas from "@/components/dictation/HandwritingCanvas";

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

export default function DictationPracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  // answers can be string (text or base64 data URL)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    correctCount: number;
    totalCount: number;
    ungradedCount: number;
  } | null>(null);

  // Manual grading state (for canvas items)
  const [gradingItemId, setGradingItemId] = useState<number | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dictation/practice/${id}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.data);

        if (data.data.status === "submitted") {
          const items = data.data.items as PracticeWord[];
          const graded = items.filter((i) => i.isCorrect !== null);
          const correct = graded.filter((i) => i.isCorrect === 1);
          setResult({
            correctCount: correct.length,
            totalCount: items.length,
            ungradedCount: items.filter((i) => i.isCorrect === null).length,
          });
        }

        // Restore existing answers
        const existing: Record<number, string> = {};
        data.data.items.forEach((item: PracticeWord) => {
          if (item.userAnswer) {
            existing[item.id] = item.userAnswer;
          }
        });
        setAnswers(existing);
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

  const handleAnswerChange = (itemId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleCanvasChange = useCallback(
    (itemId: number) => (dataUrl: string | null) => {
      setAnswers((prev) => ({
        ...prev,
        [itemId]: dataUrl || "",
      }));
    },
    []
  );

  const handleSubmit = async () => {
    if (!session) return;

    const unanswered = session.items.some((item) => {
      const isChinese = item.word.subject === "语文";
      if (isChinese) {
        return !answers[item.id] || answers[item.id].length < 100;
      }
      return !answers[item.id]?.trim();
    });

    if (unanswered) {
      if (!confirm("有未完成的题目，确定提交吗？")) return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/dictation/practice/${id}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
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

  // Manual grade a single canvas item
  const handleManualGrade = async (itemId: number, isCorrect: boolean) => {
    setGradingItemId(itemId);
    try {
      const res = await fetch(`/api/dictation/practice/${id}/grade-item`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isCorrect }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
      }
    } catch {
      setError("批改失败");
    } finally {
      setGradingItemId(null);
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

  const isSubmitted = session.status === "submitted";
  const hasResult = result !== null;
  const chineseItems = session.items.filter((i) => i.word.subject === "语文");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session.name}</h2>
            <p className="text-gray-500 mt-1">
              {isSubmitted
                ? `已提交 · 正确 ${result?.correctCount ?? 0} / ${result?.totalCount ?? 0}` +
                  (result && result.ungradedCount > 0
                    ? ` · ${result.ungradedCount} 题待批改`
                    : "")
                : `共 ${session.items.length} 个默写词`}
            </p>
          </div>
          {isSubmitted && (
            <span className="badge-green text-sm">已提交</span>
          )}
        </div>

        {/* Score bar */}
        {hasResult && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {result.correctCount}
                <span className="text-lg text-gray-400">/{result.totalCount}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">正确</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                {result.totalCount - result.correctCount - result.ungradedCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">错误</div>
            </div>
            {result.ungradedCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {result.ungradedCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">待批改</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-700">
                {result.totalCount > 0 && result.ungradedCount < result.totalCount
                  ? Math.round(
                      (result.correctCount /
                        (result.totalCount - result.ungradedCount)) *
                        100
                    )
                  : "-"}
                {result.ungradedCount < result.totalCount ? "%" : ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {result.ungradedCount < result.totalCount ? "正确率" : "等待批改"}
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

      {/* Word list */}
      <div className="space-y-6">
        {session.items.map((item, index) => {
          const isChinese = item.word.subject === "语文";

          return (
            <div
              key={item.id}
              className={`card ${
                isSubmitted && item.isCorrect !== null
                  ? item.isCorrect === 1
                    ? "border-l-4 border-l-green-400"
                    : "border-l-4 border-l-red-400"
                  : isSubmitted && isChinese
                  ? "border-l-4 border-l-yellow-400"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="badge-blue text-xs">
                    {item.word.subject}
                  </span>
                  {isChinese && !isSubmitted && (
                    <span className="text-xs text-purple-500 font-medium">
                      手写
                    </span>
                  )}
                  {isSubmitted && item.isCorrect !== null && (
                    <span
                      className={`text-xs font-medium ${
                        item.isCorrect === 1
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.isCorrect === 1 ? "正确" : "错误"}
                    </span>
                  )}
                  {isSubmitted && item.isCorrect === null && (
                    <span className="text-xs font-medium text-yellow-600">
                      待批改
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <div className="mb-3">
                <p className="text-sm text-gray-500">
                  {isChinese ? "拼音" : "中文释义"}
                </p>
                <p className="text-lg text-gray-900 font-medium">
                  {item.word.prompt || "（未设置）"}
                </p>
              </div>

              {/* Answer area */}
              {isSubmitted ? (
                /* ---- Result view ---- */
                <div className="space-y-3">
                  {/* Expected answer */}
                  <div>
                    <p className="text-sm text-gray-500">正确答案</p>
                    <p className="text-green-700 font-medium">
                      {item.word.expectedAnswer}
                    </p>
                  </div>

                  {/* User's answer */}
                  {isChinese ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">手写内容</p>
                      {item.userAnswer?.startsWith("data:image") ? (
                        <img
                          src={item.userAnswer}
                          alt="手写答案"
                          className="max-w-full rounded border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-400 text-sm">（无手写内容）</p>
                      )}
                    </div>
                  ) : (
                    item.isCorrect !== 1 && (
                      <div>
                        <p className="text-sm text-gray-500">你的答案</p>
                        <p className="text-red-600">
                          {item.userAnswer || "（未填写）"}
                        </p>
                      </div>
                    )
                  )}

                  {/* Manual grade buttons for ungraded Chinese items */}
                  {isSubmitted && item.isCorrect === null && isChinese && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">批改：</span>
                      <button
                        onClick={() => handleManualGrade(item.id, true)}
                        disabled={gradingItemId === item.id}
                        className="px-3 py-1 text-xs font-medium rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                      >
                        {gradingItemId === item.id ? "..." : "正确"}
                      </button>
                      <button
                        onClick={() => handleManualGrade(item.id, false)}
                        disabled={gradingItemId === item.id}
                        className="px-3 py-1 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        {gradingItemId === item.id ? "..." : "错误"}
                      </button>
                    </div>
                  )}

                  {item.word.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        记忆技巧：{item.word.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : isChinese ? (
                /* ---- Canvas for Chinese ---- */
                <HandwritingCanvas
                  onDataChange={handleCanvasChange(item.id)}
                  initialData={answers[item.id]?.startsWith("data:image") ? answers[item.id] : undefined}
                  height={180}
                />
              ) : (
                /* ---- Text input for English ---- */
                <div>
                  <input
                    type="text"
                    className="input-field text-lg"
                    placeholder="输入英文单词..."
                    value={answers[item.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(item.id, e.target.value)
                    }
                    autoFocus={index === 0}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center space-x-3">
        {isSubmitted ? (
          <>
            <button onClick={handleBackToList} className="btn-primary">
              返回练习列表
            </button>
            <Link href="/dictation/practice/new" className="btn-secondary">
              再来一次默写
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={submitting}
            >
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
