"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubjectEntity } from "@/types";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      const json = await res.json();
      if (json.success) setSubjects(json.data);
      else setError(json.message);
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setSubjects((prev) => [...prev, json.data]);
        setNewName("");
      } else {
        setError(json.message);
      }
    } catch {
      setError("添加失败");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name: editName.trim() } : s)));
        setEditingId(null);
      } else {
        setError(json.message);
      }
    } catch {
      setError("更新失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("删除学科会同时删除关联的单元，确定吗？")) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      } else {
        setError(json.message);
      }
    } catch {
      setError("删除失败");
    }
  };

  const subjectColors: Record<string, string> = {
    "语文": "bg-orange-100 text-orange-700",
    "数学": "bg-blue-100 text-blue-700",
    "英语": "bg-green-100 text-green-700",
  };

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">学科管理</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* Add form */}
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="输入学科名称，如：语文"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} className="btn-primary" disabled={adding || !newName.trim()}>
          {adding ? "添加中..." : "添加"}
        </button>
      </div>

      {/* Subject list */}
      <div className="space-y-2">
        {subjects.map((subject) => (
          <div key={subject.id} className="card flex items-center justify-between">
            {editingId === subject.id ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  className="input-field flex-1 py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(subject.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <button onClick={() => handleUpdate(subject.id)} className="btn-primary text-xs px-3 py-1.5">保存</button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1.5">取消</button>
              </div>
            ) : (
              <>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${subjectColors[subject.name] || "bg-gray-100 text-gray-700"}`}>
                  {subject.name}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => { setEditingId(subject.id); setEditName(subject.name); }}
                    className="text-sm text-gray-400 hover:text-primary-600 px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="text-sm text-gray-400 hover:text-red-500 px-2 py-1"
                  >
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="text-gray-400 text-sm py-8 text-center">暂无学科，请先添加</div>
        )}
      </div>
    </div>
  );
}
