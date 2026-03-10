"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  name: string;
  roll_no: string;
};

type IndividualScore = {
  technical_contribution?: number;
  ownership_role?: number;
  engineering_practices?: number;
  understanding?: number;
  total?: number;
};

type MaxConfig = {
  technical_contribution: number;
  ownership_role: number;
  engineering_practices: number;
  understanding: number;
  total: number;
};

type Props = {
  students: Student[];
  existingScores: Record<string, IndividualScore>;
  max: MaxConfig;
};

type RowState = {
  technical_contribution: string;
  ownership_role: string;
  engineering_practices: string;
  understanding: string;
};

export function IndividualMarksTable({ students, existingScores, max }: Props) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const student of students) {
      const existing = existingScores[student.id] || {};
      initial[student.id] = {
        technical_contribution:
          existing.technical_contribution !== undefined
            ? String(existing.technical_contribution)
            : "",
        ownership_role:
          existing.ownership_role !== undefined ? String(existing.ownership_role) : "",
        engineering_practices:
          existing.engineering_practices !== undefined
            ? String(existing.engineering_practices)
            : "",
        understanding:
          existing.understanding !== undefined ? String(existing.understanding) : "",
      };
    }
    return initial;
  });

  const handleChange = (
    studentId: string,
    field: keyof RowState,
    value: string,
  ) => {
    // Allow empty string for easy editing; validation happens server-side.
    if (value === "") {
      setRows((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {
            technical_contribution: "",
            ownership_role: "",
            engineering_practices: "",
            understanding: "",
          }),
          [field]: "",
        },
      }));
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num)) return;

    setRows((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          technical_contribution: "",
          ownership_role: "",
          engineering_practices: "",
          understanding: "",
        }),
        [field]: value,
      },
    }));
  };

  const totals = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const student of students) {
      const row = rows[student.id];
      if (!row) {
        result[student.id] = null;
        continue;
      }

      const fields = [
        row.technical_contribution,
        row.ownership_role,
        row.engineering_practices,
        row.understanding,
      ];

      if (fields.some((v) => v === "" || v === undefined)) {
        result[student.id] = null;
        continue;
      }

      const nums = fields.map((v) => Number(v));
      if (nums.some((n) => Number.isNaN(n))) {
        result[student.id] = null;
        continue;
      }

      result[student.id] = nums.reduce((sum, n) => sum + n, 0);
    }
    return result;
  }, [rows, students]);

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const row = rows[student.id] || {
          technical_contribution: "",
          ownership_role: "",
          engineering_practices: "",
          understanding: "",
        };
        const total = totals[student.id];

        return (
          <div
            key={student.id}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 sm:p-4 space-y-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-600 pb-2">
              <p className="font-medium text-zinc-50 text-sm sm:text-base truncate">
                {student.name}
              </p>
              <p className="text-xs text-zinc-400 shrink-0">{student.roll_no}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Technical contribution ({max.technical_contribution})
                </label>
                <Input
                  type="number"
                  min={0}
                  max={max.technical_contribution}
                  name={`student__${student.id}__technical_contribution`}
                  value={row.technical_contribution}
                  onChange={(e) =>
                    handleChange(student.id, "technical_contribution", e.target.value)
                  }
                  required
                  className="min-h-[44px] text-base bg-zinc-900 border-zinc-600 text-zinc-50 touch-manipulation"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Ownership of role ({max.ownership_role})
                </label>
                <Input
                  type="number"
                  min={0}
                  max={max.ownership_role}
                  name={`student__${student.id}__ownership_role`}
                  value={row.ownership_role}
                  onChange={(e) =>
                    handleChange(student.id, "ownership_role", e.target.value)
                  }
                  required
                  className="min-h-[44px] text-base bg-zinc-900 border-zinc-600 text-zinc-50 touch-manipulation"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Engineering practices ({max.engineering_practices})
                </label>
                <Input
                  type="number"
                  min={0}
                  max={max.engineering_practices}
                  name={`student__${student.id}__engineering_practices`}
                  value={row.engineering_practices}
                  onChange={(e) =>
                    handleChange(
                      student.id,
                      "engineering_practices",
                      e.target.value,
                    )
                  }
                  required
                  className="min-h-[44px] text-base bg-zinc-900 border-zinc-600 text-zinc-50 touch-manipulation"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Understanding / viva ({max.understanding})
                </label>
                <Input
                  type="number"
                  min={0}
                  max={max.understanding}
                  name={`student__${student.id}__understanding`}
                  value={row.understanding}
                  onChange={(e) =>
                    handleChange(student.id, "understanding", e.target.value)
                  }
                  required
                  className="min-h-[44px] text-base bg-zinc-900 border-zinc-600 text-zinc-50 touch-manipulation"
                />
              </div>
            </div>
            <div className="pt-1 text-sm font-medium text-zinc-300">
              Total: <span className="text-zinc-50">{total !== null ? total : "—"}</span> / {max.total}
            </div>
          </div>
        );
      })}
    </div>
  );
}

