"use client";

import { useState, useRef } from "react";
import { DICTATION_SUBJECTS } from "@/types";
import type { DictationSubject } from "@/types";

interface ScanResult {
  entries: Array<{ prompt: string; answer: string }>;
  subject: DictationSubject;
}

interface ScanImportProps {
  subject?: DictationSubject;
  onScanComplete: (result: ScanResult) => void;
}

export default function ScanImport({
  subject: initialSubject = "语文",
  onScanComplete,
}: ScanImportProps) {
  const [subject, setSubject] = useState<DictationSubject>(initialSubject);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("不支持的图片格式，请上传 JPG/PNG/GIF/WebP 图片");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleScan = async () => {
    if (!imageFile) return;

    setScanning(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("subject", subject);

      const res = await fetch("/api/dictation/scan-ocr", {
        method: "POST",
        body: fd,
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.message);
        return;
      }

      const { entries } = result.data;

      onScanComplete({
        entries: entries || [],
        subject,
      });
    } catch {
      setError("识别失败，请重试");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div>
        <label className="label">科目</label>
        <div className="flex space-x-2">
          {DICTATION_SUBJECTS.map((s) => (
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

      {/* Upload area */}
      <div>
        <label className="label">拍照或选择图片</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
        >
          {imagePreview ? (
            <div className="space-y-3">
              <img
                src={imagePreview}
                alt="预览"
                className="max-h-64 mx-auto rounded-lg shadow-sm object-contain"
              />
              <p className="text-sm text-gray-500">点击重新选择图片</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <svg
                  className="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="text-primary-600 font-medium">
                    点击选择图片
                  </span>{" "}
                  或拍照
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  支持 JPG / PNG / WebP，最大 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        {subject === "英语"
          ? "拍摄课本上的单词/词组/句子列表。AI 识别后会跳转到编辑界面。"
          : "拍摄课本上的生字/词语列表。AI 识别后会跳转到编辑界面。"}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Scan button */}
      <button
        onClick={handleScan}
        disabled={!imageFile || scanning}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {scanning ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>正在识别中...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>开始识别</span>
          </>
        )}
      </button>
    </div>
  );
}
