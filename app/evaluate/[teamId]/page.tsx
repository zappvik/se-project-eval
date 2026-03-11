import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { SupabaseNotConfigured } from "@/components/supabase-not-configured";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IndividualMarksTable } from "../../../components/individual-marks-table";
import { TeamMarksFields } from "@/components/team-marks-fields";
import Link from "next/link";

const ADMIN_EMAILS = new Set<string>(["zappvik@gmail.com", "admin@se.dev"]);

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
  technical_contribution: 5,
  ownership_role: 2,
  engineering_practices: 3,
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
      default:
        break;
    }

    const scores = individualScores[studentId];
    scores.total =
      scores.technical_contribution +
      scores.ownership_role +
      scores.engineering_practices;
  }

  for (const [studentId, scores] of Object.entries(individualScores)) {
    if (
      scores.technical_contribution < 0 ||
      scores.technical_contribution > INDIVIDUAL_MAX.technical_contribution ||
      scores.ownership_role < 0 ||
      scores.ownership_role > INDIVIDUAL_MAX.ownership_role ||
      scores.engineering_practices < 0 ||
      scores.engineering_practices > INDIVIDUAL_MAX.engineering_practices ||
      scores.total < 0 ||
      scores.total > INDIVIDUAL_MAX.total
    ) {
      throw new Error(`Invalid marks for student ${studentId}`);
    }
  }

  // If a record already exists, average with existing marks instead of overwriting
  const { data: existing } = await supabase
    .from("marks")
    .select("team_scores, individual_scores")
    .eq("team_id", teamId)
    .maybeSingle();

  let finalTeamScores = teamScores;
  let finalIndividualScores = individualScores;

  if (existing?.team_scores && existing?.individual_scores) {
    const existingTeam = existing.team_scores as Record<string, number>;
    const existingInd = existing.individual_scores as Record<
      string,
      { technical_contribution?: number; ownership_role?: number; engineering_practices?: number; total?: number }
    >;
    const avg = (a: number, b: number) => Math.round(((Number(a) || 0) + (Number(b) || 0)) / 2);
    finalTeamScores = {
      implementation_quality: avg(existingTeam.implementation_quality, teamScores.implementation_quality),
      stability_mocking: avg(existingTeam.stability_mocking, teamScores.stability_mocking),
      cicd: avg(existingTeam.cicd, teamScores.cicd),
      ux: avg(existingTeam.ux, teamScores.ux),
      docs_arch: avg(existingTeam.docs_arch, teamScores.docs_arch),
    };
    const studentIds = new Set([...Object.keys(individualScores), ...Object.keys(existingInd)]);
    finalIndividualScores = {} as typeof individualScores;
    for (const sid of studentIds) {
      const cur = individualScores[sid] ?? {
        technical_contribution: 0,
        ownership_role: 0,
        engineering_practices: 0,
        total: 0,
      };
      const prev = existingInd[sid] ?? cur;
      finalIndividualScores[sid] = {
        technical_contribution: avg(prev.technical_contribution ?? 0, cur.technical_contribution),
        ownership_role: avg(prev.ownership_role ?? 0, cur.ownership_role),
        engineering_practices: avg(prev.engineering_practices ?? 0, cur.engineering_practices),
        total: 0,
      };
      finalIndividualScores[sid].total =
        finalIndividualScores[sid].technical_contribution +
        finalIndividualScores[sid].ownership_role +
        finalIndividualScores[sid].engineering_practices;
    }
  }

  const { error } = await supabase.from("marks").upsert(
    {
      team_id: teamId,
      team_scores: finalTeamScores,
      individual_scores: finalIndividualScores,
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
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isAdmin = !!user.email && ADMIN_EMAILS.has(user.email);

  const teamId = resolvedParams.teamId;

  // Mirror the dashboard logic so we only ever try to load
  // teams that are actually assigned to this professor.
  const { data: professor } = await supabase
    .from("professors")
    .select("*")
    .eq("id", user.id)
    .single();

  let teamQuery = supabase.from("teams").select("*").eq("id", teamId).maybeSingle<Team>();

  if (professor && !isAdmin) {
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
    <form action={saveMarks} className="space-y-5 pb-6">
      <input type="hidden" name="team_id" value={team.id} />

      <div className="flex justify-start">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="min-h-[44px] w-full sm:w-auto cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 touch-manipulation"
        >
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <Card className="bg-zinc-900 text-zinc-50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-50 text-base sm:text-lg">
            Team Evaluation Sheet (20 marks)
          </CardTitle>
          <CardDescription className="text-zinc-200 text-sm">
            Shared marks for{" "}
            <span className="font-semibold text-zinc-50">
              {team.display_name}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMarksFields
            teamId={team.id}
            userId={user.id}
            max={TEAM_MAX}
            initialScores={teamScores}
          />
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 text-zinc-50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-50 text-base sm:text-lg">
            Individual (10 marks per student)
          </CardTitle>
          <CardDescription className="text-zinc-200 text-sm">
            Three criteria: 5 + 2 + 3 per student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IndividualMarksTable
            students={students ?? []}
            existingScores={individualScores}
            max={INDIVIDUAL_MAX}
            teamId={team.id}
            userId={user.id}
          />
        </CardContent>
        <CardFooter className="justify-end gap-3 pt-4">
          <Button type="submit" className="min-h-[48px] px-6 text-base touch-manipulation">
            Save all
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

