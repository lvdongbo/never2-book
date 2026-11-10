"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GradeSubjectUnitSelect from "./GradeSubjectUnitSelect";
import { parseBatchText, getBatchPrompts } from "@/lib/dictation-batch";
import type { DictationSubject, Semester } from "@/types";

interface EntryTableProps {
  initialEntries?: Array<{ prompt: string; answer: string }>;
  showBack?: boolean;
  onBack?: () => void;
}

export default function EntryTable({
  initialEntries = [],
  showBack = false,
  onBack,
}: EntryTableProps) {
  const router = useRouter();
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [subjectName, setSubjectName] = useState<string | null>(null);
  const prompts = getBatchPrompts(subjectName);
  const [preferredPrompt, setPreferredPrompt] = useState<DictationSubject>("语文");
  const activePrompt = prompts.find(({ subject }) => subject === preferredPrompt) ?? prompts[0];
  const showPromptTabs = prompts.length > 1;
  const [unitId, setUnitId] = useState<number | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [text, setText] = useState(() => initialEntries.map(e => `${e.answer} | ${e.prompt}`).join("\n"));
  const [copyStatus, setCopyStatus] = useState<{
    subject: DictationSubject;
    status: "copying" | "copied" | "failed";
  } | null>(null);
  const promptDialog = useRef<HTMLDialogElement>(null);
  const promptFields = useRef<Partial<Record<DictationSubject, HTMLTextAreaElement | null>>>({});
  const { entries, errors } = parseBatchText(text);
  const validCount = entries.length;
  const [globalTags, setGlobalTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCopyPrompt = async (subject: DictationSubject, prompt: string) => {
    setCopyStatus({ subject, status: "copying" });
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const field = promptFields.current[subject];
      if (!field || field.closest("[hidden]") || !promptDialog.current?.open) {
        setCopyStatus({ subject, status: "failed" });
        return;
      }
      field.focus();
      field.select();
      try {
        if (!document.execCommand("copy")) {
          setCopyStatus({ subject, status: "failed" });
          return;
        }
      } catch {
        setCopyStatus({ subject, status: "failed" });
        return;
      }
    }
    setCopyStatus({ subject, status: "copied" });
  };

  const handleSave = async () => {
    if (errors.length > 0) {
      setError("请先修正格式错误的行，再保存");
      return;
    }
    if (validCount === 0) {
      setError("请至少添加一条有效数据");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const globalTagsList = globalTags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/dictation/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          gradeId,
          unitId,
          semester,
          entries,
          tags: globalTagsList,
        }),
      });

      const result = await res.json();
      if (result.success) {
        router.push("/dictation");
      } else {
        setError(result.message);
      }
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Grade / Subject / Unit */}
      <GradeSubjectUnitSelect
        gradeId={gradeId}
        subjectId={subjectId}
        unitId={unitId}
        semester={semester}
        onGradeChange={setGradeId}
        onSubjectChange={(id, name) => {
          setSubjectId(id);
          setSubjectName(name);
        }}
        onUnitChange={setUnitId}
        onSemesterChange={setSemester}
        applyUserDefaults
      />

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label htmlFor="batch-words" className="font-medium text-sm text-gray-700">批量录入内容</label>
          <button
            type="button"
            aria-haspopup="dialog"
            className="text-sm text-primary-600 hover:text-primary-700"
            onClick={() => {
              setCopyStatus(null);
              promptDialog.current?.showModal();
            }}
          >
            查看 AI 提示词
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">每行一条：答案 | 提示 | 标签。标签可省略，多个标签用逗号分隔。</p>
        <textarea id="batch-words" rows={14} className="input-field font-mono text-sm resize-y min-h-[320px]" value={text}
          disabled={saving} onChange={e => { setText(e.target.value); setError(""); }}
          placeholder={"apple | 苹果 | 单词\ngreat fun | 非常有趣 | 词组\n波澜壮阔 | bō lán zhuàng kuò | 词语"} />
        <p className="text-sm text-gray-500 mt-2" aria-live="polite">已识别 {validCount} 条有效内容{errors.length > 0 ? `，${errors.length} 行格式错误，请修正后保存` : ""}</p>
        {errors.length > 0 && <ul className="mt-2 text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto" aria-live="polite">
          {errors.map(e => <li key={e.line}>第 {e.line} 行：{e.message}</li>)}
        </ul>}
        <dialog
          ref={promptDialog}
          aria-labelledby="batch-ai-prompt-title"
          className="w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-5 shadow-xl backdrop:bg-black/50"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 id="batch-ai-prompt-title" className="text-lg font-semibold text-gray-900">
              AI 提示词
            </h3>
            <button
              type="button"
              aria-label="关闭 AI 提示词"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => promptDialog.current?.close()}
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">把提示词和图片一起发给 AI，再将生成的内容粘贴到批量录入框。</p>
          {prompts.length === 0 && (
            <p className="mt-3 text-sm text-gray-600">当前学科暂无提示词。请选择语文或英语。</p>
          )}
          {showPromptTabs && (
            <div role="tablist" aria-label="提示词学科" className="mt-4 flex gap-4 border-b border-gray-200">
              {prompts.map(({ subject }, index) => {
                const selected = activePrompt.subject === subject;
                return (
                  <button
                    key={subject}
                    id={`batch-prompt-tab-${subject}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`batch-prompt-panel-${subject}`}
                    tabIndex={selected ? 0 : -1}
                    className={`border-b-2 px-3 py-2 text-sm font-medium ${selected
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-gray-600 hover:text-primary-700"}`}
                    onClick={() => setPreferredPrompt(subject)}
                    onKeyDown={(event) => {
                      const lastIndex = prompts.length - 1;
                      let nextIndex: number;
                      switch (event.key) {
                        case "ArrowLeft": nextIndex = (index + lastIndex) % prompts.length; break;
                        case "ArrowRight": nextIndex = (index + 1) % prompts.length; break;
                        case "Home": nextIndex = 0; break;
                        case "End": nextIndex = lastIndex; break;
                        default: return;
                      }
                      event.preventDefault();
                      const nextSubject = prompts[nextIndex].subject;
                      setPreferredPrompt(nextSubject);
                      document.getElementById(`batch-prompt-tab-${nextSubject}`)?.focus();
                    }}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3">
            {prompts.map(({ subject, prompt }) => {
              const status = copyStatus?.subject === subject ? copyStatus.status : null;
              return (
                <section
                  key={subject}
                  id={`batch-prompt-panel-${subject}`}
                  role={showPromptTabs ? "tabpanel" : undefined}
                  aria-labelledby={showPromptTabs ? `batch-prompt-tab-${subject}` : undefined}
                  hidden={activePrompt.subject !== subject}
                >
                  <label htmlFor={`batch-prompt-${subject}`} className="label">{subject}提示词</label>
                  <textarea
                    id={`batch-prompt-${subject}`}
                    ref={(field) => { promptFields.current[subject] = field; }}
                    readOnly
                    rows={16}
                    value={prompt}
                    className="input-field max-h-[52dvh] resize-none bg-gray-50 text-sm text-gray-700"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <p role="status" className="mr-auto text-sm">
                      {status === "copying" && "正在复制…"}
                      {status === "copied" && <span className="font-medium text-green-700">复制成功，提示词已存入剪贴板。</span>}
                      {status === "failed" && <span className="text-red-700">自动复制失败，请手动复制上方提示词。</span>}
                    </p>
                    <button type="button" className="btn-primary" onClick={() => handleCopyPrompt(subject, prompt)} disabled={copyStatus?.status === "copying"}>
                      {status === "copied" ? "已复制" : `复制${subject}提示词`}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </dialog>
      </div>

      {/* Global tags */}
      <div>
        <label className="label">公共标签</label>
        <p className="text-xs text-gray-400 mb-1">
          应用到所有行，逗号分隔
        </p>
        <input
          type="text"
          className="input-field"
          placeholder="例如：易错, 动物类"
          value={globalTags}
          onChange={(e) => setGlobalTags(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving || validCount === 0 || errors.length > 0}
        >
          {saving ? "保存中..." : `批量添加（${validCount} 条）`}
        </button>
        {showBack && onBack && (
          <button onClick={onBack} className="btn-secondary" disabled={saving}>
            重新拍照
          </button>
        )}
      </div>
    </div>
  );
}
