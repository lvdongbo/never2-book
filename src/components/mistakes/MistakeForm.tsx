"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import { SUBJECTS } from "@/types";
import type { Subject, Mistake } from "@/types";

interface MistakeFormProps {
  initialData?: Mistake;
  onSubmit: (data: {
    subject: Subject;
    questionText: string;
    questionImages: string[];
    explanationText: string;
    explanationImages: string[];
  }) => Promise<void>;
  submitLabel?: string;
}

export default function MistakeForm({
  initialData,
  onSubmit,
  submitLabel = "保存",
}: MistakeFormProps) {
  const [subject, setSubject] = useState<Subject>(
    initialData?.subject || "语文"
  );
  const [questionText, setQuestionText] = useState(
    initialData?.questionText || ""
  );
  const [questionImages, setQuestionImages] = useState<string[]>(
    initialData?.questionImages || []
  );
  const [explanationText, setExplanationText] = useState(
    initialData?.explanationText || ""
  );
  const [explanationImages, setExplanationImages] = useState<string[]>(
    initialData?.explanationImages || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [questionMode, setQuestionMode] = useState<"text" | "image">(
    initialData?.questionImages?.length && !initialData?.questionText
      ? "image"
      : "text"
  );
  const [explanationMode, setExplanationMode] = useState<"text" | "image">(
    initialData?.explanationImages?.length && !initialData?.explanationText
      ? "image"
      : "text"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!questionText.trim() && questionImages.length === 0) {
      setError("请至少填写题目文字或上传题目图片");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        subject,
        questionText,
        questionImages,
        explanationText,
        explanationImages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Subject selector */}
      <div>
        <label className="label">科目</label>
        <div className="flex space-x-2">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                subject === s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Question section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">题目</h3>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setQuestionMode("text")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                questionMode === "text"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              手填
            </button>
            <button
              type="button"
              onClick={() => setQuestionMode("image")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                questionMode === "image"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              贴图
            </button>
          </div>
        </div>
        {questionMode === "text" ? (
          <textarea
            className="input-field min-h-[120px] resize-y"
            placeholder="输入题目内容..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        ) : (
          <ImageUploader
            images={questionImages}
            onChange={setQuestionImages}
          />
        )}
      </div>

      {/* Explanation section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">讲解</h3>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setExplanationMode("text")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                explanationMode === "text"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              手填
            </button>
            <button
              type="button"
              onClick={() => setExplanationMode("image")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                explanationMode === "image"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              贴图
            </button>
          </div>
        </div>
        {explanationMode === "text" ? (
          <textarea
            className="input-field min-h-[120px] resize-y"
            placeholder="输入讲解内容..."
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
          />
        ) : (
          <ImageUploader
            images={explanationImages}
            onChange={setExplanationImages}
          />
        )}
      </div>

      {/* Preview toggle */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "关闭预览" : "预览效果"}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="card border-2 border-dashed border-primary-300 bg-primary-50/30">
          <h3 className="text-sm font-medium text-primary-700 mb-4">
            预览效果
          </h3>

          <div className="space-y-4">
            <div>
              <span className="badge-blue">{subject}</span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">题目</h4>
              {questionText && (
                <p className="text-gray-900 whitespace-pre-wrap mb-2">
                  {questionText}
                </p>
              )}
              {questionImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {questionImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`题目图片 ${i + 1}`}
                      className="rounded-lg border border-gray-200 max-h-48 object-cover"
                    />
                  ))}
                </div>
              )}
              {!questionText && questionImages.length === 0 && (
                <p className="text-gray-400 text-sm">暂无题目内容</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">讲解</h4>
              {explanationText && (
                <p className="text-gray-900 whitespace-pre-wrap mb-2">
                  {explanationText}
                </p>
              )}
              {explanationImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {explanationImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`讲解图片 ${i + 1}`}
                      className="rounded-lg border border-gray-200 max-h-48 object-cover"
                    />
                  ))}
                </div>
              )}
              {!explanationText && explanationImages.length === 0 && (
                <p className="text-gray-400 text-sm">暂无讲解内容</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center space-x-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
