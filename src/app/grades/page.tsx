"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grade } from "@/types";

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchGrades = useCallback(async () => {
    try {
      const res = await fetch("/api/grades");
      const json = await res.json();
      if (json.success) setGrades(json.data);
      else setError(json.message);
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setGrades((prev) => [...prev, json.data]);
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
      const res = await fetch(`/api/grades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setGrades((prev) => prev.map((g) => (g.id === id ? { ...g, name: editName.trim() } : g)));
        setEditingId(null);
      } else {
        setError(json.message);
      }
    } catch {
      setError("更新失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("删除年级会同时删除关联的单元，确定吗？")) return;
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setGrades((prev) => prev.filter((g) => g.id !== id));
      } else {
        setError(json.message);
      }
    } catch {
      setError("删除失败");
    }
  };

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">年级管理</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* Add form */}
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="输入年级名称，如：一年级"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} className="btn-primary" disabled={adding || !newName.trim()}>
          {adding ? "添加中..." : "添加"}
        </button>
      </div>

      {/* Grade list */}
      <div className="space-y-2">
        {grades.map((grade) => (
          <div key={grade.id} className="card flex items-center justify-between">
            {editingId === grade.id ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  className="input-field flex-1 py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(grade.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <button onClick={() => handleUpdate(grade.id)} className="btn-primary text-xs px-3 py-1.5">保存</button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1.5">取消</button>
              </div>
            ) : (
              <>
                <span className="font-medium text-gray-800">{grade.name}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => { setEditingId(grade.id); setEditName(grade.name); }}
                    className="text-sm text-gray-400 hover:text-primary-600 px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(grade.id)}
                    className="text-sm text-gray-400 hover:text-red-500 px-2 py-1"
                  >
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {grades.length === 0 && (
          <div className="text-gray-400 text-sm py-8 text-center">暂无年级，请先添加</div>
        )}
      </div>
    </div>
  );
}
