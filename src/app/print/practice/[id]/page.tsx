"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface PracticeItem {
  id: number;
  mistake: {
    subject: string;
    questionText: string;
    questionImages: string[];
  };
}

interface PracticeSession {
  id: number;
  name: string;
  items: PracticeItem[];
}

export default function PrintPracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/practice/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSession(data.data);
        } else {
          setError(data.message || "练习不存在");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="card text-center py-12">
          <p className="text-red-500 mb-4">{error || "练习不存在"}</p>
          <button onClick={() => router.push("/practice")} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page-wrapper py-6 px-4">
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="btn-secondary">
          返回
        </button>
        <button onClick={() => window.print()} className="btn-primary">
          打印
        </button>
      </div>

      <div className="print-sheet mx-auto bg-white">
        <header className="print-header">
          <h1 className="print-title">{session.name}</h1>
          <div className="print-meta">
            <span>共 {session.items.length} 题</span>
            <span>打印时间：{new Date().toLocaleString("zh-CN")}</span>
          </div>
          <div className="print-student-line">
            <span>姓名：____________</span>
            <span>日期：____________</span>
          </div>
        </header>

        <main className="print-questions">
          {session.items.map((item, index) => (
            <section key={item.id} className="print-question-block">
              <div className="print-question-head">
                <span className="print-question-index">第 {index + 1} 题</span>
                <span className="print-subject">{item.mistake.subject}</span>
              </div>

              {item.mistake.questionText && (
                <p className="print-question-text">{item.mistake.questionText}</p>
              )}

              {item.mistake.questionImages.length > 0 && (
                <div className="print-image-list">
                  {item.mistake.questionImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`题目图片 ${i + 1}`}
                      className="print-question-image"
                    />
                  ))}
                </div>
              )}

              <div className="print-answer-area" />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
