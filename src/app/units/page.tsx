"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grade, SubjectEntity } from "@/types";
import { SEMESTERS } from "@/types";

interface UnitRow {
  id: number;
  gradeId: number;
  subjectId: number;
  name: string;
  semester: string;
  sortOrder: number;
  grade: { id: number; name: string };
  subjectEntity: { id: number; name: string };
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterGradeId, setFilterGradeId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGradeId, setNewGradeId] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newSemester, setNewSemester] = useState("上学期");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGradeId, setEditGradeId] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editSemester, setEditSemester] = useState("上学期");

  const fetchUnits = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterGradeId) params.set("gradeId", filterGradeId);
      if (filterSubjectId) params.set("subjectId", filterSubjectId);
      if (filterSemester) params.set("semester", filterSemester);
      const res = await fetch("/api/units?" + params.toString());
      const json = await res.json();
      if (json.success) setUnits(json.data);
      else setError(json.message);
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [filterGradeId, filterSubjectId, filterSemester]);

  const fetchRefs = useCallback(async () => {
    try {
      const [gRes, sRes] = await Promise.all([
        fetch("/api/grades"),
        fetch("/api/subjects"),
      ]);
      const gJson = await gRes.json();
      const sJson = await sRes.json();
      if (gJson.success) setGrades(gJson.data);
      if (sJson.success) setSubjects(sJson.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchRefs(); }, [fetchRefs]);
  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const handleAdd = async () => {
    if (!newName.trim() || !newGradeId || !newSubjectId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          gradeId: parseInt(newGradeId),
          subjectId: parseInt(newSubjectId),
          semester: newSemester,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAdd(false);
        setNewName("");
        setNewGradeId("");
        setNewSubjectId("");
        setNewSemester("上学期");
        fetchUnits();
        fetchRefs();
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
      const res = await fetch(`/api/units/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          gradeId: parseInt(editGradeId),
          subjectId: parseInt(editSubjectId),
          semester: editSemester,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        fetchUnits();
      } else {
        setError(json.message);
      }
    } catch {
      setError("更新失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该单元吗？")) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchUnits();
      } else {
        setError(json.message);
      }
    } catch {
      setError("删除失败");
    }
  };

  const semesterBadge = (semester: string) =>
    semester === "上学期"
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">单元管理</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          添加单元
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input-field py-1.5 text-sm w-auto" value={filterGradeId} onChange={(e) => setFilterGradeId(e.target.value)}>
          <option value="">全部年级</option>
          {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>
        <select className="input-field py-1.5 text-sm w-auto" value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)}>
          <option value="">全部学科</option>
          {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <select className="input-field py-1.5 text-sm w-auto" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="">全部学期</option>
          {SEMESTERS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {/* Unit list */}
      <div className="space-y-2">
        {units.map((unit) => (
          <div key={unit.id} className="card flex items-center justify-between">
            {editingId === unit.id ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="text"
                  className="input-field py-1.5 text-sm w-28"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <select className="input-field py-1.5 text-sm" value={editGradeId} onChange={(e) => setEditGradeId(e.target.value)}>
                  {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
                <select className="input-field py-1.5 text-sm" value={editSubjectId} onChange={(e) => setEditSubjectId(e.target.value)}>
                  {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <select className="input-field py-1.5 text-sm" value={editSemester} onChange={(e) => setEditSemester(e.target.value)}>
                  {SEMESTERS.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button onClick={() => handleUpdate(unit.id)} className="btn-primary text-xs px-3 py-1.5">保存</button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1.5">取消</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{unit.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${semesterBadge(unit.semester)}`}>
                    {unit.semester}
                  </span>
                  <span className="text-xs text-gray-400">{unit.grade?.name}</span>
                  <span className="text-xs text-gray-400">{unit.subjectEntity?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingId(unit.id);
                      setEditName(unit.name);
                      setEditGradeId(String(unit.gradeId));
                      setEditSubjectId(String(unit.subjectId));
                      setEditSemester(unit.semester);
                    }}
                    className="text-sm text-gray-400 hover:text-primary-600 px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="text-sm text-gray-400 hover:text-red-500 px-2 py-1"
                  >
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {units.length === 0 && (
          <div className="text-gray-400 text-sm py-8 text-center">暂无单元，请先添加年级和学科</div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">添加单元</h2>
            <div className="space-y-3">
              <div>
                <label className="label">年级</label>
                <select className="input-field" value={newGradeId} onChange={(e) => setNewGradeId(e.target.value)}>
                  <option value="">请选择</option>
                  {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label">学科</label>
                <select className="input-field" value={newSubjectId} onChange={(e) => setNewSubjectId(e.target.value)}>
                  <option value="">请选择</option>
                  {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label">单元名称</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：第一单元"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div>
                <label className="label">学期</label>
                <div className="flex space-x-2">
                  {SEMESTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewSemester(s)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newSemester === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">取消</button>
              <button onClick={handleAdd} className="btn-primary" disabled={adding || !newName.trim() || !newGradeId || !newSubjectId}>
                {adding ? "添加中..." : "确认添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
