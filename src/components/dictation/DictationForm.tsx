"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import GradeSubjectUnitSelect from "./GradeSubjectUnitSelect";
import type { DictationSubject, DictationWord, SubjectEntity, Semester } from "@/types";

interface DictationFormProps {
  initialData?: DictationWord;
  onSubmit: (data: {
    subject: DictationSubject;
    gradeId?: number | null;
    subjectId?: number | null;
    unitId?: number | null;
    semester?: Semester | null;
    word: string;
    prompt: string;
    expectedAnswer: string;
    wrongAnswer: string;
    notes: string;
    tags: string[];
  }) => Promise<void>;
  submitLabel?: string;
}

function deriveSubjectName(subjectId: number | null | undefined, subjects: SubjectEntity[]): string {
  if (!subjectId) return "";
  const found = subjects.find((s) => s.id === subjectId);
  return found?.name || "";
}

function getLabels(subjectName: string) {
  if (subjectName === "英语") {
    return {
      answer: "英文",
      answerPlaceholder: "beautiful",
      prompt: "中文",
      promptPlaceholder: "美丽的",
      isChineseSubject: false,
    };
  }
  return {
    answer: "汉字",
    answerPlaceholder: "波澜壮阔",
    prompt: "拼音",
    promptPlaceholder: "bo lan zhuang kuo",
    isChineseSubject: true,
  };
}

export default function DictationForm({
  initialData,
  onSubmit,
  submitLabel = "保存",
}: DictationFormProps) {
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [gradeId, setGradeId] = useState<number | null>(initialData?.gradeId ?? null);
  const [subjId, setSubjId] = useState<number | null>(initialData?.subjectId ?? null);
  const [unitId, setUnitId] = useState<number | null>(initialData?.unitId ?? null);
  const [semester, setSemester] = useState<Semester | null>(
    initialData?.semester ?? initialData?.unit?.semester ?? null
  );
  const [prompt, setPrompt] = useState(initialData?.prompt || "");
  const [answer, setAnswer] = useState(initialData?.expectedAnswer || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [tagsInput, setTagsInput] = useState(
    (initialData?.tags || []).join("，")
  );
  const [loading, setLoading] = useState(false);
  const [pinyinLoading, setPinyinLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSubjects(d.data); })
      .catch(() => {});
  }, []);

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [tagsInput]);

  const subjectName = deriveSubjectName(subjId, subjects);
  const labels = useMemo(() => getLabels(subjectName), [subjectName]);

  const notesPlaceholder = subjectName === "英语"
    ? "例如：beau-ty-full，三个部分拼起来"
    : "例如：注意「澜」有三点水";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!answer.trim()) {
      setError("请输入" + labels.answer);
      return;
    }
    if (!prompt.trim()) {
      setError("请输入" + labels.prompt);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        subject: (subjectName || "语文") as DictationSubject,
        gradeId,
        subjectId: subjId,
        unitId,
        semester,
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

  const handleAutoPinyin = async (value: string) => {
    if (!value.trim() || prompt.trim() || !labels.isChineseSubject) return;
    setPinyinLoading(true);
    try {
      const res = await fetch("/api/dictation/pinyin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value.trim() }),
      });
      const r = await res.json();
      if (r.success && r.data) setPrompt(r.data);
    } catch {
      // silent
    } finally {
      setPinyinLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Grade / Subject / Unit selectors */}
      <GradeSubjectUnitSelect
        gradeId={gradeId}
        subjectId={subjId}
        unitId={unitId}
        semester={semester}
        onGradeChange={setGradeId}
        onSubjectChange={setSubjId}
        onUnitChange={setUnitId}
        onSemesterChange={setSemester}
        applyUserDefaults={!initialData}
      />

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
          onBlur={(e) => handleAutoPinyin(e.target.value)}
        />
      </div>

      {/* Prompt */}
      <div>
        <label className="label" htmlFor="prompt">
          {labels.prompt} <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">默写时展示给学生的提示内容</p>
        <div className="relative">
          <input
            id="prompt"
            type="text"
            className="input-field"
            placeholder={labels.promptPlaceholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          {pinyinLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              转换中...
            </span>
          )}
        </div>
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
          可选，用逗号分隔多个标签，例如：易错, 动物类
        </p>
        <input
          id="tags"
          type="text"
          className="input-field"
          placeholder="例如：易错, 动物类"
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
