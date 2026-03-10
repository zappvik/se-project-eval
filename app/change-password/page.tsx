"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user || !data.user.email) {
          router.replace("/login");
          return;
        }

        setUserEmail(data.user.email);
        setReady(true);
      } catch {
        router.replace("/login");
      }
    };

    void init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!userEmail) {
      setError("Unable to determine your account email. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();

      // Re-authenticate with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo("Your password has been updated. Please sign in again with your new password.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Unable to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center pt-8 sm:pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            {ready
              ? "Update your password using your current credentials."
              : "Checking your session..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter the new password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {info && !error && <p className="text-sm text-emerald-700">{info}</p>}
              <Button
                type="submit"
                className="w-full cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-transform"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-600 hover:text-zinc-900"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

