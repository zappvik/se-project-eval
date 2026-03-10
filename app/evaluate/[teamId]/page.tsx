import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IndividualMarksTable } from "../../../components/individual-marks-table";
import Link from "next/link";

type Team = {
  id: string;
  display_name: string;
  level: string;
};

type Student = {
  id: string;
  name: string;
  roll_no: string;
};

const TEAM_MAX = {
  implementation_quality: 8,
  stability_mocking: 4,
  cicd: 3,
  ux: 2,
  docs_arch: 3,
} as const;

const INDIVIDUAL_MAX = {
  technical_contribution: 4,
  ownership_role: 2,
  engineering_practices: 2,
  understanding: 2,
  total: 10,
} as const;

async function saveMarks(formData: FormData) {
  "use server";

  const teamId = formData.get("team_id") as string | null;
  if (!teamId) {
    throw new Error("Missing team id");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teamScores = {
    implementation_quality: Number(
      formData.get("team_implementation_quality") || 0,
    ),
    stability_mocking: Number(formData.get("team_stability_mocking") || 0),
    cicd: Number(formData.get("team_cicd") || 0),
    ux: Number(formData.get("team_ux") || 0),
    docs_arch: Number(formData.get("team_docs_arch") || 0),
  };

  // Clamp to allowed ranges
  (Object.keys(TEAM_MAX) as (keyof typeof TEAM_MAX)[]).forEach((key) => {
    const max = TEAM_MAX[key];
    const v = teamScores[key];
    if (v < 0 || v > max) {
      throw new Error(`Team ${key} must be between 0 and ${max}`);
    }
  });

  const individualScores: Record<
    string,
    {
      technical_contribution: number;
      ownership_role: number;
      engineering_practices: number;
      understanding: number;
      total: number;
    }
  > = {};

  for (const [field, value] of formData.entries()) {
    const name = String(field);
    if (!name.startsWith("student_")) continue;
    const [, studentId, metric] = name.split("__");
    if (!studentId || !metric) continue;

    const num = Number(value || 0);
    if (!individualScores[studentId]) {
      individualScores[studentId] = {
        technical_contribution: 0,
        ownership_role: 0,
        engineering_practices: 0,
        understanding: 0,
        total: 0,
      };
    }

    switch (metric) {
      case "technical_contribution":
        individualScores[studentId].technical_contribution = num;
        break;
      case "ownership_role":
        individualScores[studentId].ownership_role = num;
        break;
      case "engineering_practices":
        individualScores[studentId].engineering_practices = num;
        break;
      case "understanding":
        individualScores[studentId].understanding = num;
        break;
      default:
        break;
    }

    const scores = individualScores[studentId];
    scores.total =
      scores.technical_contribution +
      scores.ownership_role +
      scores.engineering_practices +
      scores.understanding;
  }

  for (const [studentId, scores] of Object.entries(individualScores)) {
    if (
      scores.technical_contribution < 0 ||
      scores.technical_contribution > INDIVIDUAL_MAX.technical_contribution ||
      scores.ownership_role < 0 ||
      scores.ownership_role > INDIVIDUAL_MAX.ownership_role ||
      scores.engineering_practices < 0 ||
      scores.engineering_practices > INDIVIDUAL_MAX.engineering_practices ||
      scores.understanding < 0 ||
      scores.understanding > INDIVIDUAL_MAX.understanding ||
      scores.total < 0 ||
      scores.total > INDIVIDUAL_MAX.total
    ) {
      throw new Error(`Invalid marks for student ${studentId}`);
    }
  }

  const { error } = await supabase.from("marks").upsert(
    {
      team_id: teamId,
      team_scores: teamScores,
      individual_scores: individualScores,
    },
    { onConflict: "team_id" },
  );

  if (error) {
    throw error;
  }

  redirect("/dashboard?saved=1");
}

export default async function EvaluateTeamPage({
  params,
}: {
  // In this Next.js version, `params` is passed as a Promise.
  params: Promise<{ teamId: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teamId = resolvedParams.teamId;

  // Mirror the dashboard logic so we only ever try to load
  // teams that are actually assigned to this professor.
  const { data: professor } = await supabase
    .from("professors")
    .select("*")
    .eq("id", user.id)
    .single();

  let teamQuery = supabase.from("teams").select("*").eq("id", teamId).maybeSingle<Team>();

  if (professor) {
    // Ensure the team we load is one where this professor is assigned.
    teamQuery = supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .contains("faculty_ids", [professor.id])
      .maybeSingle<Team>();
  }

  const { data: team } = await teamQuery;

  if (!team) {
    return (
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Team not found</CardTitle>
          <CardDescription>
            This team could not be loaded. It may not exist, or you might not be
            assigned to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/dashboard"
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-100"
          >
            Back to dashboard
          </a>
        </CardContent>
      </Card>
    );
  }

  const [{ data: students }, { data: marks }] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("team_id", team.id)
      .order("roll_no", { ascending: true }) as any,
    supabase.from("marks").select("*").eq("team_id", team.id).maybeSingle(),
  ]);

  const teamScores = (marks?.team_scores as any) || {};
  const individualScores = (marks?.individual_scores as any) || {};

  return (
    <form action={saveMarks} className="space-y-6">
      <input type="hidden" name="team_id" value={team.id} />

      <div className="flex justify-start">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50"
        >
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            Team Evaluation Sheet (20 marks)
          </CardTitle>
          <CardDescription className="text-zinc-200">
            Shared marks recorded once per team. These apply to every student in{" "}
            <span className="font-semibold text-zinc-50">
              {team.display_name}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team_implementation_quality" className="text-zinc-50">
              Implementation quality{" "}
              <span className="text-xs text-zinc-300">(8)</span>
            </Label>
            <Input
              id="team_implementation_quality"
              name="team_implementation_quality"
              type="number"
              min={0}
              max={TEAM_MAX.implementation_quality}
              defaultValue={teamScores.implementation_quality ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_stability_mocking" className="text-zinc-50">
              System stability + mocking{" "}
              <span className="text-xs text-zinc-300">(4)</span>
            </Label>
            <Input
              id="team_stability_mocking"
              name="team_stability_mocking"
              type="number"
              min={0}
              max={TEAM_MAX.stability_mocking}
              defaultValue={teamScores.stability_mocking ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_cicd" className="text-zinc-50">
              CI/CD pipeline <span className="text-xs text-zinc-300">(3)</span>
            </Label>
            <Input
              id="team_cicd"
              name="team_cicd"
              type="number"
              min={0}
              max={TEAM_MAX.cicd}
              defaultValue={teamScores.cicd ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_ux" className="text-zinc-50">
              User experience <span className="text-xs text-zinc-300">(2)</span>
            </Label>
            <Input
              id="team_ux"
              name="team_ux"
              type="number"
              min={0}
              max={TEAM_MAX.ux}
              defaultValue={teamScores.ux ?? ""}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="team_docs_arch" className="text-zinc-50">
              Documentation + architecture{" "}
              <span className="text-xs text-zinc-300">(3)</span>
            </Label>
            <Input
              id="team_docs_arch"
              name="team_docs_arch"
              type="number"
              min={0}
              max={TEAM_MAX.docs_arch}
              defaultValue={teamScores.docs_arch ?? ""}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle className="text-zinc-50">
            Individual Evaluation Sheet (10 marks per student)
          </CardTitle>
          <CardDescription className="text-zinc-200">
            Each student gets marks across four criteria (4 + 2 + 2 + 2). Totals
            are computed from these values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IndividualMarksTable
            students={students ?? []}
            existingScores={individualScores}
            max={INDIVIDUAL_MAX}
          />
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button type="submit">Save all</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

