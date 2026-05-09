"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DictationForm from "@/components/dictation/DictationForm";
import type { DictationWord } from "@/types";

export default function EditDictationWordPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [word, setWord] = useState<DictationWord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/dictation/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWord(data.data);
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: {
    subject: "语文" | "英语";
    word: string;
    prompt: string;
    expectedAnswer: string;
    wrongAnswer: string;
    notes: string;
    tags: string[];
  }) => {
    const res = await fetch(`/api/dictation/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    router.push("/dictation");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">{error || "默写词不存在"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">编辑默写词</h2>
      <DictationForm
        initialData={word}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
      />
    </div>
  );
}
