"use client";

import { useRef, useState, useCallback } from "react";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

export default function ImageUploader({
  images,
  onChange,
  label = "",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          onChange([...images, data.data.url]);
        } else {
          setError(data.message || "上传失败");
        }
      } catch {
        setError("网络错误，上传失败");
      } finally {
        setUploading(false);
      }
    },
    [images, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
          break;
        }
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {images.length > 0 ? (
        /* Already has an image — show preview with delete */
        <div className="relative group rounded-lg overflow-hidden border border-gray-200">
          <ImageLightbox
            src={images[0]}
            alt="已上传图片"
            className="w-full object-contain max-h-48 bg-gray-50 cursor-zoom-in"
          />
          <button
            type="button"
            onClick={removeImage.bind(null, 0)}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full
              flex items-center justify-center text-sm opacity-0 group-hover:opacity-100
              transition-opacity hover:bg-red-600 shadow"
            title="删除图片"
          >
            ✕
          </button>
        </div>
      ) : uploading ? (
        /* Uploading state */
        <div className="image-paste-area">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            <span>上传中...</span>
          </div>
        </div>
      ) : (
        /* No image yet — show upload area */
        <div
          className={`image-paste-area ${dragOver ? "active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
        >
          <div className="text-gray-400">
            <svg
              className="mx-auto h-10 w-10 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">
              点击上传、拖拽图片或{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                Ctrl+V
              </kbd>{" "}
              粘贴
            </p>
            <p className="text-xs mt-1">支持 JPG/PNG/GIF/WebP，最大 10MB</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
