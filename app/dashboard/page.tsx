import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardToast } from "@/components/dashboard-toast";

type TeamRow = {
  id: string;
  display_name: string;
  level: string;
  has_marks: boolean;
  students: string[];
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: professor } = await supabase
    .from("professors")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!professor) {
    // Fallback: let any authenticated user see all teams for now
    // You can lock this down later by ensuring professors table is populated.
  }

  let query = supabase
    .from("teams")
    .select("id, display_name, level, faculty_ids, marks:marks(team_id), students:students(name)")
    .order("display_name", { ascending: true });

  if (professor) {
    query = query.contains("faculty_ids", [professor.id]);
  }

  const { data: teamsData } = await query;

  const teams: TeamRow[] =
    teamsData?.map((t: any) => ({
      id: t.id,
      display_name: t.display_name,
      level: t.level,
      has_marks: Array.isArray(t.marks) ? t.marks.length > 0 : !!t.marks,
      students: Array.isArray(t.students)
        ? t.students.map((s: any) => s.name).filter(Boolean)
        : [],
    })) ?? [];

  const pending = teams.filter((t) => !t.has_marks);
  const completed = teams.filter((t) => t.has_marks);

  return (
    <div className="space-y-6">
      <DashboardToast />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Assigned Teams
          </h2>
          <p className="text-sm text-zinc-500">
            View teams and record shared panel evaluation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending evaluation</span>
              <Badge>{pending.length}</Badge>
            </CardTitle>
            <CardDescription>
              Teams that do not yet have marks recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.length === 0 && (
              <p className="text-sm text-zinc-500">
                No pending teams. Great job!
              </p>
            )}
              {pending.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-md border border-dashed border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-zinc-900">
                    {team.display_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Level: {team.level}
                  </p>
                  {team.students.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {team.students.join(", ")}
                    </p>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={`/evaluate/${team.id}`}>Evaluate</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Completed</span>
              <Badge variant="outline">{completed.length}</Badge>
            </CardTitle>
            <CardDescription>
              Teams with marks saved by any panel member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.length === 0 && (
              <p className="text-sm text-zinc-500">
                No teams completed yet.
              </p>
            )}
            {completed.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-md border border-zinc-100 bg-white px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-zinc-900">
                    {team.display_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Level: {team.level}
                  </p>
                  {team.students.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {team.students.join(", ")}
                    </p>
                  )}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/evaluate/${team.id}`}>View / Edit</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

