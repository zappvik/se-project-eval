"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type TeamMax = {
  implementation_quality: number;
  stability_mocking: number;
  cicd: number;
  ux: number;
  docs_arch: number;
};

type TeamScores = Partial<TeamMax>;

type Props = {
  teamId: string;
  userId: string;
  max: TeamMax;
  initialScores: TeamScores;
};

export function TeamMarksFields({ teamId, userId, max, initialScores }: Props) {
  const storageKey = useMemo(
    () => `se-eval:team:${teamId}:user:${userId}`,
    [teamId, userId],
  );

  const [scores, setScores] = useState<Record<keyof TeamMax, string>>({
    implementation_quality:
      initialScores.implementation_quality !== undefined
        ? String(initialScores.implementation_quality)
        : "",
    stability_mocking:
      initialScores.stability_mocking !== undefined
        ? String(initialScores.stability_mocking)
        : "",
    cicd: initialScores.cicd !== undefined ? String(initialScores.cicd) : "",
    ux: initialScores.ux !== undefined ? String(initialScores.ux) : "",
    docs_arch:
      initialScores.docs_arch !== undefined ? String(initialScores.docs_arch) : "",
  });

  // On mount, hydrate from localStorage if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof scores>;
      setScores((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Persist to localStorage whenever scores change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {
      // ignore
    }
  }, [scores, storageKey]);

  const handleChange = (field: keyof TeamMax, value: string) => {
    if (value === "") {
      setScores((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="team_implementation_quality" className="text-zinc-50 text-sm">
          Implementation quality <span className="text-xs text-zinc-300">[8] (3-5-8)</span>
        </Label>
        <Input
          id="team_implementation_quality"
          name="team_implementation_quality"
          type="number"
          min={0}
          max={max.implementation_quality}
          value={scores.implementation_quality}
          onChange={(e) => handleChange("implementation_quality", e.target.value)}
          required
          className="min-h-[44px] text-base bg-zinc-800 border-zinc-600 text-zinc-50 touch-manipulation"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team_stability_mocking" className="text-zinc-50 text-sm">
          System stability + mocking <span className="text-xs text-zinc-300">[4] (1-2-4)</span>
        </Label>
        <Input
          id="team_stability_mocking"
          name="team_stability_mocking"
          type="number"
          min={0}
          max={max.stability_mocking}
          value={scores.stability_mocking}
          onChange={(e) => handleChange("stability_mocking", e.target.value)}
          required
          className="min-h-[44px] text-base bg-zinc-800 border-zinc-600 text-zinc-50 touch-manipulation"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team_cicd" className="text-zinc-50 text-sm">
          CI/CD pipeline <span className="text-xs text-zinc-300">[3] (1-2-3)</span>
        </Label>
        <Input
          id="team_cicd"
          name="team_cicd"
          type="number"
          min={0}
          max={max.cicd}
          value={scores.cicd}
          onChange={(e) => handleChange("cicd", e.target.value)}
          required
          className="min-h-[44px] text-base bg-zinc-800 border-zinc-600 text-zinc-50 touch-manipulation"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team_ux" className="text-zinc-50 text-sm">
          User experience <span className="text-xs text-zinc-300">[2] (1-2)</span>
        </Label>
        <Input
          id="team_ux"
          name="team_ux"
          type="number"
          min={0}
          max={max.ux}
          value={scores.ux}
          onChange={(e) => handleChange("ux", e.target.value)}
          required
          className="min-h-[44px] text-base bg-zinc-800 border-zinc-600 text-zinc-50 touch-manipulation"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="team_docs_arch" className="text-zinc-50 text-sm">
          Documentation + architecture{" "}
          <span className="text-xs text-zinc-300">[3] (1-2-3)</span>
        </Label>
        <Input
          id="team_docs_arch"
          name="team_docs_arch"
          type="number"
          min={0}
          max={max.docs_arch}
          value={scores.docs_arch}
          onChange={(e) => handleChange("docs_arch", e.target.value)}
          required
          className="min-h-[44px] text-base bg-zinc-800 border-zinc-600 text-zinc-50 touch-manipulation"
        />
      </div>
    </div>
  );
}

