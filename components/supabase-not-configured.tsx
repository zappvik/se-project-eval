import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseNotConfigured() {
  return (
    <div className="flex w-full justify-center px-2 pt-8 pb-10 sm:pt-14">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <CardTitle>Setup required</CardTitle>
          <CardDescription>
            This app is missing the Supabase environment variables needed to run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-700">
          <p>
            Please set these in your hosting provider (for Vercel: Project Settings → Environment Variables),
            then redeploy:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs sm:text-sm text-zinc-800">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-xs text-zinc-500">
            If you’re running locally, add them to your environment before starting `next dev`.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

