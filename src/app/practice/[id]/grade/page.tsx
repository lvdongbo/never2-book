"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface PracticeItem {
  id: number;
  mistakeId: number;
  userAnswer: string;
  isCorrect: number | null;
  mistake: {
    subject: string;
    questionText: string;
    questionImages: string[];
    explanationText: string;
    explanationImages: string[];
  };
}

interface PracticeSession {
  id: number;
  name: string;
  status: string;
  items: PracticeItem[];
}

export default function GradePracticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/practice/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSession(data.data);

          // Pre-populate grades if already graded
          const initialGrades: Record<number, boolean> = {};
          data.data.items.forEach((item: PracticeItem) => {
            if (item.isCorrect !== null) {
              initialGrades[item.id] = item.isCorrect === 1;
            }
          });
          setGrades(initialGrades);
        } else {
          setError(data.message || "练习不存在");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleGrade = (itemId: number) => {
    setGrades((prev) => {
      const current = prev[itemId];
      if (current === undefined) {
        return { ...prev, [itemId]: true }; // Default to correct
      } else if (current === true) {
        return { ...prev, [itemId]: false }; // Toggle to wrong
      } else {
        // Remove grade
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
    });
  };

  const handleSubmitGrades = async () => {
    if (Object.keys(grades).length === 0) {
      setError("请至少批改一道题");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/practice/${id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/practice/${id}`);
        router.refresh();
      } else {
        setError(data.message);
      }
    } catch {
      setError("批改失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => router.push("/practice")} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (!session || session.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">练习中没有题目</p>
          <button onClick={() => router.push("/practice")} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const isGraded = session.status === "graded";
  const gradedCount = Object.keys(grades).length;
  const correctCount = Object.values(grades).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isGraded ? "批改结果" : "批改练习"}
        </h2>
        <p className="text-gray-500 mt-1">
          {session.name} · {session.items.length} 道题
          {gradedCount > 0 && (
            <span className="ml-2">
              · 已批 {gradedCount}/{session.items.length}
              {gradedCount > 0 && ` · 正确 ${correctCount}`}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Items */}
      <div className="space-y-6 mb-6">
        {session.items.map((item, index) => {
          const gradeValue = grades[item.id];
          const explanationShown = showExplanation[item.id] || false;

          return (
            <div key={item.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">
                    第 {index + 1} 题
                  </span>
                  <span className="badge-blue text-xs">
                    {item.mistake.subject}
                  </span>
                  {gradeValue !== undefined && (
                    <span
                      className={`badge text-xs ${
                        gradeValue ? "badge-green" : "badge-red"
                      }`}
                    >
                      {gradeValue ? "正确" : "错误"}
                    </span>
                  )}
                </div>

                {/* Grade toggle - only when not yet fully graded */}
                {!isGraded && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setGrades((prev) => ({ ...prev, [item.id]: true }));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        gradeValue === true
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50"
                      }`}
                    >
                      ✓ 正确
                    </button>
                    <button
                      onClick={() => {
                        setGrades((prev) => ({ ...prev, [item.id]: false }));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        gradeValue === false
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-red-50"
                      }`}
                    >
                      ✗ 错误
                    </button>
                  </div>
                )}
              </div>

              {/* Question */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">题目</h4>
                {item.mistake.questionText && (
                  <p className="text-gray-900 text-sm whitespace-pre-wrap mb-2">
                    {item.mistake.questionText}
                  </p>
                )}
                {item.mistake.questionImages.length > 0 && (
                  <div className="space-y-2">
                    {item.mistake.questionImages.map((url, i) => (
                      <ImageLightbox
                        key={i}
                        src={url}
                        alt={`题目图片 ${i + 1}`}
                        className="max-w-full rounded border border-gray-200 max-h-48 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* User answer */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-1">
                  作答
                </h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">
                  {item.userAnswer || (
                    <span className="text-gray-400">未作答</span>
                  )}
                </p>
              </div>

              {/* Explanation toggle */}
              <button
                onClick={() =>
                  setShowExplanation((prev) => ({
                    ...prev,
                    [item.id]: !explanationShown,
                  }))
                }
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {explanationShown ? "隐藏讲解" : "查看讲解"}
              </button>

              {explanationShown && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    讲解
                  </h4>
                  {item.mistake.explanationText && (
                    <p className="text-blue-900 text-sm whitespace-pre-wrap mb-2">
                      {item.mistake.explanationText}
                    </p>
                  )}
                  {item.mistake.explanationImages.length > 0 && (
                    <div className="space-y-2">
                      {item.mistake.explanationImages.map((url, i) => (
                        <ImageLightbox
                          key={i}
                          src={url}
                          alt={`讲解图片 ${i + 1}`}
                          className="max-w-full rounded border border-blue-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit grades */}
      {!isGraded && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              已批改 {gradedCount}/{session.items.length} 道题
              {gradedCount > 0 && (
                <span className="ml-2">
                  （正确 {correctCount}，错误 {gradedCount - correctCount}）
                </span>
              )}
            </div>
            <button
              onClick={handleSubmitGrades}
              className="btn-success"
              disabled={submitting || gradedCount === 0}
            >
              {submitting ? "保存中..." : "确认批改结果"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
