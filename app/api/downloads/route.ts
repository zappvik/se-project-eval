import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
type Section = (typeof SECTIONS)[number];

function getSectionFromRoll(rollNo: string | null): Section | null {
  if (!rollNo) return null;
  const match = rollNo.match(/(\d{3})$/);
  if (!match) return null;
  const lastThree = match[1];
  const hundredsDigit = Number(lastThree[0]);
  if (Number.isNaN(hundredsDigit)) return null;
  const index = hundredsDigit;
  if (index < 0 || index >= SECTIONS.length) return null;
  return SECTIONS[index];
}

function buildCsvRow(values: (string | number)[]) {
  return values
    .map((value) => {
      if (typeof value === "number") return String(value);
      const v = value ?? "";
      if (v.includes(",") || v.includes("\n") || v.includes('"')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    })
    .join(",");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sectionParam = url.searchParams.get("section") as Section | null;

  if (!sectionParam || !SECTIONS.includes(sectionParam)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, display_name, level, students(id, name, roll_no), marks(team_scores, individual_scores)")
    .order("display_name", { ascending: true });

  const header = buildCsvRow([
    "section",
    "roll_no",
    "student_name",
    "team_display_name",
    "team_level",
    "team_implementation_quality",
    "team_stability_mocking",
    "team_cicd",
    "team_ux",
    "team_docs_arch",
    "ind_technical_contribution",
    "ind_ownership_role",
    "ind_engineering_practices",
    "ind_total",
  ]);

  const rows: string[] = [header];

  for (const team of teams || []) {
    const teamScores = (Array.isArray(team.marks) ? team.marks[0]?.team_scores : team.marks?.team_scores) as
      | Record<string, number>
      | null
      | undefined;
    const individualScores = (Array.isArray(team.marks)
      ? team.marks[0]?.individual_scores
      : team.marks?.individual_scores) as
      | Record<
          string,
          {
            technical_contribution?: number;
            ownership_role?: number;
            engineering_practices?: number;
            total?: number;
          }
        >
      | null
      | undefined;

    const students = (team.students || []) as {
      id: string;
      name: string | null;
      roll_no: string | null;
    }[];

    for (const student of students) {
      const sec = getSectionFromRoll(student.roll_no);
      if (sec !== sectionParam) continue;

      const sScores = (individualScores && individualScores[student.id]) || {};

      const row = buildCsvRow([
        sec,
        student.roll_no ?? "",
        student.name ?? "",
        team.display_name ?? "",
        team.level ?? "",
        teamScores?.implementation_quality ?? 0,
        teamScores?.stability_mocking ?? 0,
        teamScores?.cicd ?? 0,
        teamScores?.ux ?? 0,
        teamScores?.docs_arch ?? 0,
        sScores.technical_contribution ?? 0,
        sScores.ownership_role ?? 0,
        sScores.engineering_practices ?? 0,
        sScores.total ?? 0,
      ]);

      rows.push(row);
    }
  }

  const csv = rows.join("\r\n");
  const filename = `se-section-${sectionParam}-marks.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

