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
  isRandom: number;
  items: PracticeItem[];
}

export default function DoPracticePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/practice/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSession(data.data);

          // If already submitted or graded, redirect to view
          if (data.data.status !== "in_progress") {
            if (data.data.status === "submitted") {
              router.replace(`/practice/${id}/grade`);
            } else {
              // Show graded results
            }
          }
        } else {
          setError(data.message || "练习不存在");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const setAnswer = (itemId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/practice/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/practice/${id}/grade`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("提交失败");
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

  if (error) {
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

  const currentItem = session.items[currentIndex];
  const totalItems = session.items.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{session.name}</h2>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {totalItems}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / totalItems) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="badge-blue">{currentItem.mistake.subject}</span>
          <span className="text-sm text-gray-400">
            第 {currentIndex + 1} 题
          </span>
        </div>

        {/* Question text */}
        {currentItem.mistake.questionText && (
          <div className="text-gray-900 whitespace-pre-wrap mb-4">
            {currentItem.mistake.questionText}
          </div>
        )}

        {/* Question images */}
        {currentItem.mistake.questionImages.length > 0 && (
          <div className="space-y-2 mb-4">
            {currentItem.mistake.questionImages.map((url, i) => (
              <ImageLightbox
                key={i}
                src={url}
                alt={`题目图片 ${i + 1}`}
                className="max-w-full rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}

        {/* Answer area */}
        <div>
          <label className="label">你的答案</label>
          <textarea
            className="input-field min-h-[120px] resize-y"
            placeholder="在这里输入你的答案..."
            value={answers[currentItem.id] || ""}
            onChange={(e) => setAnswer(currentItem.id, e.target.value)}
          />
        </div>

        {/* Explanation toggle */}
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-sm text-primary-600 hover:text-primary-700 mt-4"
        >
          {showExplanation ? "隐藏讲解" : "查看讲解"}
        </button>

        {showExplanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">讲解</h4>
            {currentItem.mistake.explanationText && (
              <p className="text-blue-900 text-sm whitespace-pre-wrap mb-2">
                {currentItem.mistake.explanationText}
              </p>
            )}
            {currentItem.mistake.explanationImages.length > 0 && (
              <div className="space-y-2">
                {currentItem.mistake.explanationImages.map((url, i) => (
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          className="btn-secondary"
          disabled={currentIndex === 0}
        >
          上一题
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            已答 {answeredCount}/{totalItems}
          </span>

          {currentIndex < totalItems - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="btn-primary"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-success"
              disabled={submitting}
            >
              {submitting ? "提交中..." : "提交练习"}
            </button>
          )}
        </div>
      </div>

      {/* Quick jump */}
      <div className="mt-6 flex flex-wrap gap-2">
        {session.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setCurrentIndex(index)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              index === currentIndex
                ? "bg-primary-600 text-white"
                : answers[item.id]
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
