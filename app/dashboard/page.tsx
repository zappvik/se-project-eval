import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { SupabaseNotConfigured } from "@/components/supabase-not-configured";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardToast } from "@/components/dashboard-toast";

const ADMIN_EMAILS = new Set<string>(["zappvik@gmail.com", "admin@se.dev"]);

type TeamRow = {
  id: string;
  display_name: string;
  level: string;
  has_marks: boolean;
  students: string[];
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = !!user.email && ADMIN_EMAILS.has(user.email);

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

  if (professor && !isAdmin) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Assigned Teams
          </h2>
          <p className="text-sm text-zinc-500">
            View teams and record shared panel evaluation.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="min-h-[44px] w-full sm:w-auto cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 touch-manipulation"
        >
          <Link href="/downloads">Downloads</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg">
              <span>Pending evaluation</span>
              <Badge className="shrink-0">{pending.length}</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Teams that do not yet have marks recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 && (
              <p className="text-sm text-zinc-500">
                No pending teams. Great job!
              </p>
            )}
            {pending.map((team) => (
              <div
                key={team.id}
                className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-zinc-900 text-sm sm:text-base">
                    {team.display_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Level: {team.level}
                  </p>
                  {team.students.length > 0 && (
                    <p className="text-xs text-zinc-500 line-clamp-2 sm:line-clamp-none">
                      {team.students.join(", ")}
                    </p>
                  )}
                </div>
                <Button asChild size="sm" className="min-h-[44px] w-full sm:w-auto touch-manipulation shrink-0">
                  <Link href={`/evaluate/${team.id}`}>Evaluate</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg">
              <span>Completed</span>
              <Badge variant="outline" className="shrink-0">{completed.length}</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Teams with marks saved by any panel member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.length === 0 && (
              <p className="text-sm text-zinc-500">
                No teams completed yet.
              </p>
            )}
            {completed.map((team) => (
              <div
                key={team.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-zinc-900 text-sm sm:text-base">
                    {team.display_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Level: {team.level}
                  </p>
                  {team.students.length > 0 && (
                    <p className="text-xs text-zinc-500 line-clamp-2 sm:line-clamp-none">
                      {team.students.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  size="sm"
                  className="min-h-[44px] w-full sm:w-auto touch-manipulation shrink-0 !bg-indigo-600 !text-white hover:!bg-indigo-700 focus-visible:!ring-indigo-500"
                >
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

