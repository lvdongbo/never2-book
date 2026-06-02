"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DictationWordWithStats, DictationRandomRules, Grade, SubjectEntity, Semester } from "@/types";

interface UnitOption {
  id: number;
  name: string;
  semester: string;
  gradeId: number;
  subjectId: number;
}

export default function NewDictationPracticePage() {
  const router = useRouter();
  const [words, setWords] = useState<DictationWordWithStats[]>([]);
  const [initialSubjectId, setInitialSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"manual" | "random">("manual");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Hierarchy filters
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [filterGradeId, setFilterGradeId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterSemester, setFilterSemester] = useState<Semester | "">("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [defaultsReady, setDefaultsReady] = useState(false);

  // Random generation state
  const [randomCount, setRandomCount] = useState(10);
  const [randomOrderBy, setRandomOrderBy] =
    useState<DictationRandomRules["orderBy"]>("errors");
  const [randomOrderDir, setRandomOrderDir] =
    useState<DictationRandomRules["orderDir"]>("desc");
  const [randomGradeId, setRandomGradeId] = useState("");
  const [randomSubjectId, setRandomSubjectId] = useState("");
  const [randomUnitId, setRandomUnitId] = useState("");
  const [randomSemester, setRandomSemester] = useState<Semester | "">("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subjectId") || "";
    if (subjectId) {
      setInitialSubjectId(subjectId);
      setFilterSubjectId(subjectId);
      setRandomSubjectId(subjectId);
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const defaultGrade = d.data?.currentGradeId ? String(d.data.currentGradeId) : "";
        const defaultSemester = (d.data?.currentSemester as Semester | undefined) || "";

        if (defaultGrade) {
          setFilterGradeId(defaultGrade);
        }
        if (defaultSemester) {
          setFilterSemester(defaultSemester);
        }
        if (defaultGrade) {
          setRandomGradeId(defaultGrade);
        }
        if (defaultSemester) {
          setRandomSemester(defaultSemester);
        }
      })
      .catch(() => {})
      .finally(() => setDefaultsReady(true));
  }, []);

  useEffect(() => {
    if (!initialSubjectId) return;
    setFilterSubjectId(initialSubjectId);
    setRandomSubjectId(initialSubjectId);
  }, [initialSubjectId]);

  const fetchRefs = useCallback(async () => {
    const [gRes, sRes] = await Promise.all([
      fetch("/api/grades"),
      fetch("/api/subjects"),
    ]);
    const g = await gRes.json();
    const s = await sRes.json();
    if (g.success) setGrades(g.data);
    if (s.success) {
      setSubjects(s.data);
      if (s.data.length > 0 && !initialSubjectId) {
        const firstSubjectId = String(s.data[0].id);
        setFilterSubjectId(firstSubjectId);
        setRandomSubjectId(firstSubjectId);
      }
    }
  }, [initialSubjectId]);

  useEffect(() => { fetchRefs(); }, [fetchRefs]);

  const fetchWords = useCallback(async () => {
    if (!defaultsReady) return;
    if (!filterSubjectId) {
      setWords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterGradeId) params.set("gradeId", filterGradeId);
      if (filterSubjectId) params.set("subjectId", filterSubjectId);
      if (filterUnitId) params.set("unitId", filterUnitId);
      if (filterSemester) params.set("semester", filterSemester);
      const res = await fetch("/api/dictation?" + params.toString());
      const data = await res.json();
      if (data.success) {
        setWords(data.data.filter((w: DictationWordWithStats) => !w.isMastered));
      }
    } catch {
      setError("加载默写词失败");
    } finally {
      setLoading(false);
    }
  }, [defaultsReady, filterGradeId, filterSubjectId, filterUnitId, filterSemester]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const fetchUnits = useCallback(async () => {
    if (!defaultsReady) return;
    if (!filterGradeId && !filterSubjectId) { setUnitOptions([]); return; }
    const params = new URLSearchParams();
    if (filterGradeId) params.set("gradeId", filterGradeId);
    if (filterSubjectId) params.set("subjectId", filterSubjectId);
    if (filterSemester) params.set("semester", filterSemester);
    const res = await fetch("/api/units?" + params.toString());
    const json = await res.json();
    if (json.success) setUnitOptions(json.data);
  }, [defaultsReady, filterGradeId, filterSubjectId, filterSemester]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  useEffect(() => {
    if (!randomGradeId && !randomSubjectId) return;
    const params = new URLSearchParams();
    if (randomGradeId) params.set("gradeId", randomGradeId);
    if (randomSubjectId) params.set("subjectId", randomSubjectId);
    if (randomSemester) params.set("semester", randomSemester);
    fetch("/api/units?" + params.toString())
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUnitOptions(d.data);
      })
      .catch(() => {});
  }, [randomGradeId, randomSubjectId, randomSemester]);

  const allTags = useMemo(
    () => Array.from(new Set(words.flatMap((word) => word.tags))).sort(),
    [words]
  );

  const filtered = useMemo(() => {
    if (selectedTags.length === 0) {
      return words;
    }
    return words.filter((word) =>
      word.tags.some((tag) => selectedTags.includes(tag))
    );
  }, [words, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((item) => String(item.id) === subjectId);
    return subject?.name || "全部学科";
  };

  const buildSessionName = (
    modeLabel: "手动默写" | "随机默写",
    subjectId: string
  ) => {
    const subjectName = getSubjectName(subjectId);
    return `${subjectName}-${modeLabel} ${new Date().toLocaleString("zh-CN")}`;
  };

  const pendingCount = filtered.length;

  const randomSourceCount = words.length;

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((w) => w.id)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleManualCreate = async () => {
    if (selected.size === 0) {
      setError("请至少选择一个默写词");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/dictation/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buildSessionName("手动默写", filterSubjectId),
          wordIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dictation/practice/${data.data.id}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleRandomCreate = async () => {
    if (subjects.length > 0 && !randomSubjectId) {
      setError("请先选择学科");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/dictation/practice/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: randomCount,
          orderBy: randomOrderBy,
          orderDir: randomOrderDir,
          gradeId: randomGradeId ? parseInt(randomGradeId) : undefined,
          subjectId: randomSubjectId ? parseInt(randomSubjectId) : undefined,
          unitId: randomUnitId ? parseInt(randomUnitId) : undefined,
          semester: randomSemester || undefined,
          name: buildSessionName("随机默写", randomSubjectId),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dictation/practice/${data.data.id}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">开始默写</h2>
        <p className="text-gray-500 mt-1">
          共 {pendingCount} 个待过关默写词可供练习
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Mode selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          手动选择
        </button>
        <button
          onClick={() => setMode("random")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "random"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          随机生成
        </button>
      </div>

      {mode === "manual" ? (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <select className="input-field py-1.5 text-sm w-auto" value={filterGradeId} onChange={(e) => { setFilterGradeId(e.target.value); setFilterUnitId(""); }}>
                <option value="">全部年级</option>
                {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={filterSemester} onChange={(e) => { setFilterSemester((e.target.value as Semester | "") || ""); setFilterUnitId(""); }}>
                <option value="">全部学期</option>
                <option value="上学期">上学期</option>
                <option value="下学期">下学期</option>
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={filterSubjectId} onChange={(e) => { setFilterSubjectId(e.target.value); setFilterUnitId(""); }}>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={filterUnitId} onChange={(e) => setFilterUnitId(e.target.value)}>
                <option value="">全部单元</option>
                {unitOptions.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.semester})</option>))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                全选
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                清空
              </button>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">标签筛选（可多选）</p>
                <button
                  type="button"
                  onClick={clearTags}
                  className="text-xs text-gray-400 hover:text-gray-600"
                  disabled={selectedTags.length === 0}
                >
                  清空标签
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-purple-100 text-purple-700 border-purple-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Word selection */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">
                {words.length === 0
                  ? "所有默写词已过关！"
                  : "该科目没有待过关的默写词"}
              </p>
              <Link href="/dictation/new" className="btn-primary mt-4 inline-block">
                添加新默写词
              </Link>
              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">当前标签筛选下无结果，可清空标签后重试</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {filtered.map((word) => (
                <label
                  key={word.id}
                  className={`card flex items-start space-x-3 cursor-pointer transition-all ${
                    selected.has(word.id)
                      ? "ring-2 ring-primary-500 border-primary-500"
                      : "hover:shadow-md"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(word.id)}
                    onChange={() => toggleSelect(word.id)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {word.subjectEntity && (
                        <span className="badge-blue text-xs">{word.subjectEntity.name}</span>
                      )}
                      {!word.subjectEntity && (
                        <span className="badge-blue text-xs">{word.subject}</span>
                      )}
                      {(word.grade?.name || word.semester || word.unit?.name) && (
                        <span className="text-xs text-gray-500">
                          {[word.grade?.name, word.semester, word.unit?.name].filter(Boolean).join("/")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 text-sm mb-1">
                      <span className="text-xs text-gray-400">看</span>
                      <span className="text-gray-500">{word.prompt || "（无）"}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-xs text-gray-400">写</span>
                      <span className="font-semibold text-gray-900">{word.expectedAnswer}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span>练习 {word.totalPractices} 次</span>
                      <span className="text-green-500">
                        正确 {word.totalCorrect}
                      </span>
                      <span className="text-red-500">
                        错误 {word.totalWrong}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <button
              onClick={handleManualCreate}
              className="btn-primary"
              disabled={creating || selected.size === 0}
            >
              {creating
                ? "创建中..."
                : `开始默写（已选 ${selected.size} 个词）`}
            </button>
          )}
        </>
      ) : (
        /* Random generation */
        <div className="card space-y-4">
          <div>
            <label className="label">默写词数量</label>
            <input
              type="number"
              value={randomCount}
              onChange={(e) =>
                setRandomCount(
                  Math.max(1, Math.min(50, parseInt(e.target.value) || 10))
                )
              }
              className="input-field w-32"
              min={1}
              max={50}
            />
          </div>

          <div>
            <label className="label">排序规则</label>
            <div className="flex space-x-2">
              {[
                { value: "errors", label: "按错误次数" },
                { value: "practices", label: "按练习次数" },
                { value: "random", label: "随机" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setRandomOrderBy(
                      opt.value as DictationRandomRules["orderBy"]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderBy === opt.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {randomOrderBy !== "random" && (
            <div>
              <label className="label">排序方向</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setRandomOrderDir("desc")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderDir === "desc"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  从高到低
                </button>
                <button
                  onClick={() => setRandomOrderDir("asc")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    randomOrderDir === "asc"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  从低到高
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="label">筛选条件（可选）</label>
            <div className="flex flex-wrap gap-2">
              <select className="input-field py-1.5 text-sm w-auto" value={randomGradeId} onChange={(e) => { setRandomGradeId(e.target.value); setRandomUnitId(""); }}>
                <option value="">全部年级</option>
                {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={randomSemester} onChange={(e) => { setRandomSemester((e.target.value as Semester | "") || ""); setRandomUnitId(""); }}>
                <option value="">全部学期</option>
                <option value="上学期">上学期</option>
                <option value="下学期">下学期</option>
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={randomSubjectId} onChange={(e) => { setRandomSubjectId(e.target.value); setRandomUnitId(""); }}>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <select className="input-field py-1.5 text-sm w-auto" value={randomUnitId} onChange={(e) => setRandomUnitId(e.target.value)}>
                <option value="">全部单元</option>
                {unitOptions.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.semester})</option>))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRandomCreate}
            className="btn-primary"
            disabled={creating || randomSourceCount === 0 || (subjects.length > 0 && !randomSubjectId)}
          >
            {creating
              ? "生成中..."
              : `随机生成默写（从 ${randomSourceCount} 个词中抽取）`}
          </button>
        </div>
      )}
    </div>
  );
}
