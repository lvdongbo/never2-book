"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DictationForm from "@/components/dictation/DictationForm";
import ScanImport from "@/components/dictation/ScanImport";
import EntryTable from "@/components/dictation/EntryTable";
import type { CreateDictationWordInput, DictationSubject } from "@/types";

type Mode = "single" | "batch" | "scan";

interface ScanResult {
  entries: Array<{ prompt: string; answer: string }>;
  subject: DictationSubject;
}

export default function NewDictationWordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("single");

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "batch" || m === "scan") {
      setMode(m);
    }
  }, [searchParams]);

  // Scan flow state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleSingleSubmit = async (data: CreateDictationWordInput) => {
    const res = await fetch("/api/dictation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    router.push("/dictation");
  };

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result);
  };

  const handleBackToScan = () => {
    setScanResult(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setScanResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">添加默写词</h2>

      {/* Mode toggle */}
      <div className="flex space-x-2 mb-6">
        {(
          [
            ["single", "单个添加"],
            ["batch", "批量添加"],
            ["scan", "拍照录入"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => switchMode(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Single mode */}
      {mode === "single" && (
        <DictationForm onSubmit={handleSingleSubmit} submitLabel="添加默写词" />
      )}

      {/* Batch mode */}
      {mode === "batch" && <EntryTable subject="语文" initialEntries={[]} />}

      {/* Scan mode: two-step */}
      {mode === "scan" && !scanResult && (
        <ScanImport onScanComplete={handleScanComplete} />
      )}
      {mode === "scan" && scanResult && (
        <EntryTable
          subject={scanResult.subject}
          initialEntries={scanResult.entries}
          showBack
          onBack={handleBackToScan}
        />
      )}
    </div>
  );
}
