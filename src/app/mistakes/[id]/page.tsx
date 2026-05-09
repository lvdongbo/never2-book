"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import MistakeForm from "@/components/mistakes/MistakeForm";
import type { Mistake, Subject } from "@/types";

export default function EditMistakePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/mistakes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMistake(data.data);
        } else {
          setError(data.message || "错题不存在");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: {
    subject: Subject;
    questionText: string;
    questionImages: string[];
    explanationText: string;
    explanationImages: string[];
  }) => {
    const res = await fetch(`/api/mistakes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || "更新失败");
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/mistakes");
      router.refresh();
    }, 1000);
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
          <button onClick={() => router.push("/mistakes")} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            更新成功！
          </h3>
          <p className="text-gray-500">正在跳转...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">编辑错题</h2>
        <p className="text-gray-500 mt-1">修改错题的内容和图片</p>
      </div>
      {mistake && (
        <MistakeForm
          initialData={mistake}
          onSubmit={handleSubmit}
          submitLabel="保存修改"
        />
      )}
    </div>
  );
}
