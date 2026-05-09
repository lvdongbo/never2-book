"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MistakeForm from "@/components/mistakes/MistakeForm";
import type { Subject } from "@/types";

export default function NewMistakePage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: {
    subject: Subject;
    questionText: string;
    questionImages: string[];
    explanationText: string;
    explanationImages: string[];
  }) => {
    const res = await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || "添加失败");
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/mistakes");
      router.refresh();
    }, 1000);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            错题添加成功！
          </h3>
          <p className="text-gray-500">正在跳转到错题列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">添加错题</h2>
        <p className="text-gray-500 mt-1">录入新的错题，支持文字和图片</p>
      </div>
      <MistakeForm onSubmit={handleSubmit} submitLabel="添加错题" />
    </div>
  );
}
