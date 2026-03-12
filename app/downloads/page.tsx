import { redirect } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { SupabaseNotConfigured } from "@/components/supabase-not-configured";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

type Section = (typeof SECTIONS)[number];

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  return (
    <div className="space-y-6 pb-6">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Section-wise marks CSV</CardTitle>
          <CardDescription className="text-sm">
            Select a section (A–H) and download a CSV with team and individual marks for all students in that section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action="/api/downloads"
            method="GET"
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-4"
          >
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="section" className="text-sm font-medium text-zinc-900">
                Section
              </Label>
              <select
                id="section"
                name="section"
                defaultValue="A"
                className="w-full h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-11 px-6 text-sm font-medium touch-manipulation w-full sm:w-auto cursor-pointer border-zinc-700 !bg-zinc-900 !text-zinc-50 hover:!bg-zinc-800 hover:!text-zinc-50"
            >
              Download CSV
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

