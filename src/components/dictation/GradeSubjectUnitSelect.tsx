"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grade, SubjectEntity, Semester } from "@/types";

interface UnitOption {
  id: number;
  name: string;
  semester: string;
  gradeId: number;
  subjectId: number;
}

interface GradeSubjectUnitSelectProps {
  gradeId: number | null;
  subjectId: number | null;
  unitId: number | null;
  semester: Semester | null;
  onGradeChange: (id: number | null) => void;
  onSubjectChange: (id: number | null) => void;
  onUnitChange: (id: number | null) => void;
  onSemesterChange: (semester: Semester | null) => void;
  applyUserDefaults?: boolean;
}

export default function GradeSubjectUnitSelect({
  gradeId,
  subjectId,
  unitId,
  semester,
  onGradeChange,
  onSubjectChange,
  onUnitChange,
  onSemesterChange,
  applyUserDefaults = false,
}: GradeSubjectUnitSelectProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (!applyUserDefaults) return;

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        if (!gradeId && d.data?.currentGradeId) {
          onGradeChange(d.data.currentGradeId);
        }
        if (!semester && d.data?.currentSemester) {
          onSemesterChange(d.data.currentSemester as Semester);
        }
      })
      .catch(() => {});
  }, [applyUserDefaults, gradeId, semester, onGradeChange, onSemesterChange]);

  useEffect(() => {
    fetch("/api/grades")
      .then((r) => r.json())
      .then((d) => { if (d.success) setGrades(d.data); })
      .catch(() => {});
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSubjects(d.data); })
      .catch(() => {});
  }, []);

  const fetchUnits = useCallback(async () => {
    if (!gradeId && !subjectId) {
      setUnitOptions([]);
      return;
    }
    setLoadingUnits(true);
    try {
      const params = new URLSearchParams();
      if (gradeId) params.set("gradeId", String(gradeId));
      if (subjectId) params.set("subjectId", String(subjectId));
      if (semester) params.set("semester", semester);
      const res = await fetch("/api/units?" + params.toString());
      const json = await res.json();
      if (json.success) setUnitOptions(json.data);
    } catch {
      // ignore
    } finally {
      setLoadingUnits(false);
    }
  }, [gradeId, subjectId, semester]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const handleGradeChange = (value: string) => {
    const id = value ? parseInt(value) : null;
    onGradeChange(id);
    if (id !== gradeId) {
      onUnitChange(null);
    }
  };

  const handleSubjectChange = (value: string) => {
    const id = value ? parseInt(value) : null;
    onSubjectChange(id);
    if (id !== subjectId) {
      onUnitChange(null);
    }
  };

  const handleUnitChange = (value: string) => {
    const id = value ? parseInt(value) : null;
    onUnitChange(id);
  };

  const handleSemesterChange = (value: string) => {
    const nextSemester = value ? (value as Semester) : null;
    onSemesterChange(nextSemester);
    onUnitChange(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex-1 min-w-[120px]">
        <label className="label text-xs">年级</label>
        <select
          className="input-field py-1.5 text-sm"
          value={gradeId ?? ""}
          onChange={(e) => handleGradeChange(e.target.value)}
        >
          <option value="">不限</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="label text-xs">学期</label>
        <select
          className="input-field py-1.5 text-sm"
          value={semester ?? ""}
          onChange={(e) => handleSemesterChange(e.target.value)}
        >
          <option value="">不限</option>
          <option value="上学期">上学期</option>
          <option value="下学期">下学期</option>
        </select>
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="label text-xs">学科</label>
        <select
          className="input-field py-1.5 text-sm"
          value={subjectId ?? ""}
          onChange={(e) => handleSubjectChange(e.target.value)}
        >
          <option value="">不限</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="label text-xs">单元</label>
        <select
          className="input-field py-1.5 text-sm"
          value={unitId ?? ""}
          onChange={(e) => handleUnitChange(e.target.value)}
          disabled={loadingUnits}
        >
          <option value="">不限</option>
          {unitOptions.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.semester})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
