"use client";

import { useEffect, useState } from "react";
import type { Grade, Semester } from "@/types";

export default function SettingsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [currentGradeId, setCurrentGradeId] = useState<string>("");
  const [currentSemester, setCurrentSemester] = useState<Semester | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/grades"), fetch("/api/settings")])
      .then(async ([gRes, sRes]) => {
        const g = await gRes.json();
        const s = await sRes.json();

        if (g.success) {
          setGrades(g.data);
        }
        if (s.success) {
          if (s.data?.currentGradeId) {
            setCurrentGradeId(String(s.data.currentGradeId));
          }
          if (s.data?.currentSemester) {
            setCurrentSemester(s.data.currentSemester as Semester);
          }
        }
      })
      .catch(() => {
        setError("加载个人设置失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentGradeId: currentGradeId ? parseInt(currentGradeId, 10) : null,
          currentSemester: currentSemester || null,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "保存失败");
        return;
      }
      setSuccess("已保存");
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
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
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">个人设置</h2>
      <p className="text-sm text-gray-500 mb-6">
        设置当前年级和学期，用于单词管理与录入默认筛选。
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <label className="label">当前年级</label>
          <select
            className="input-field"
            value={currentGradeId}
            onChange={(e) => setCurrentGradeId(e.target.value)}
          >
            <option value="">未设置</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">当前学期</label>
          <select
            className="input-field"
            value={currentSemester}
            onChange={(e) => setCurrentSemester((e.target.value as Semester | "") || "")}
          >
            <option value="">未设置</option>
            <option value="上学期">上学期</option>
            <option value="下学期">下学期</option>
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}
