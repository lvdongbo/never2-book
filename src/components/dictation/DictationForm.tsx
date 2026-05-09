"use client";

import { useState, useMemo, type FormEvent } from "react";
import { DICTATION_SUBJECTS } from "@/types";
import type { DictationSubject, DictationWord } from "@/types";

interface DictationFormProps {
  initialData?: DictationWord;
  onSubmit: (data: {
    subject: DictationSubject;
    word: string;
    prompt: string;
    expectedAnswer: string;
    wrongAnswer: string;
    notes: string;
    tags: string[];
  }) => Promise<void>;
  submitLabel?: string;
}

/** Field labels that adapt to the selected subject */
const LABELS: Record<
  DictationSubject,
  {
    prompt: string;
    promptPlaceholder: string;
    answer: string;
    answerPlaceholder: string;
  }
> = {
  语文: {
    prompt: "拼音",
    promptPlaceholder: "bo lan zhuang kuo",
    answer: "中文词语",
    answerPlaceholder: "波澜壮阔",
  },
  英语: {
    prompt: "中文释义",
    promptPlaceholder: "美丽的",
    answer: "英文单词",
    answerPlaceholder: "beautiful",
  },
};

export default function DictationForm({
  initialData,
  onSubmit,
  submitLabel = "保存",
}: DictationFormProps) {
  const [subject, setSubject] = useState<DictationSubject>(
    initialData?.subject || "语文"
  );
  const [prompt, setPrompt] = useState(initialData?.prompt || "");
  const [answer, setAnswer] = useState(initialData?.expectedAnswer || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [tagsInput, setTagsInput] = useState(
    (initialData?.tags || []).join("，")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [tagsInput]);

  const labels = useMemo(() => LABELS[subject], [subject]);

  const notesPlaceholder =
    subject === "英语"
      ? "例如：beau-ty-full，三个部分拼起来"
      : "例如：注意「澜」有三点水";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!prompt.trim()) {
      setError("请输入" + labels.prompt);
      return;
    }
    if (!answer.trim()) {
      setError("请输入" + labels.answer);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        subject,
        word: answer.trim(),
        prompt: prompt.trim(),
        expectedAnswer: answer.trim(),
        wrongAnswer: "",
        notes: notes.trim(),
        tags: parsedTags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Subject selector */}
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

      {/* Prompt */}
      <div>
        <label className="label" htmlFor="prompt">
          {labels.prompt} <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">默写时展示给学生的内容</p>
        <input
          id="prompt"
          type="text"
          className="input-field"
          placeholder={labels.promptPlaceholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Answer */}
      <div>
        <label className="label" htmlFor="answer">
          {labels.answer} <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">
          学生应该写出的正确内容（提交时系统自动比对，不区分大小写）
        </p>
        <input
          id="answer"
          type="text"
          className="input-field"
          placeholder={labels.answerPlaceholder}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="label" htmlFor="notes">
          备注
        </label>
        <p className="text-xs text-gray-400 mb-1">可选，记忆口诀、易错提醒等</p>
        <textarea
          id="notes"
          className="input-field min-h-[60px] resize-y"
          placeholder={notesPlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="label" htmlFor="tags">
          标签
        </label>
        <p className="text-xs text-gray-400 mb-1">
          可选，用逗号分隔多个标签，例如：三年级上, 易错, 动物类
        </p>
        <input
          id="tags"
          type="text"
          className="input-field"
          placeholder="例如：三年级上, 易错"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center space-x-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
