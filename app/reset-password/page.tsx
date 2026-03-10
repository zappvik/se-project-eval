"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createSupabaseBrowserClient();

      // Supabase can send either a code in the URL hash or token_hash in search params,
      // depending on template configuration.
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = hashParams.get("code");

      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (tokenHash && type === "recovery" && email) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
            email,
          });
          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          throw error ?? new Error("No active session");
        }

        setCanReset(true);
      } catch {
        setError("This password reset link is invalid or has expired. Please request a new one from the login page.");
        setCanReset(false);
      }
    };

    init();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo("Your password has been updated. You can now sign in with your new password.");
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
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            {canReset
              ? "Choose a new password for your account."
              : "We could not verify your reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canReset && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
          {!canReset && (
            <p className="text-sm text-zinc-700">
              Go back to the login page and request a new password reset email.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-600 hover:text-zinc-900"
            onClick={() => router.push("/login")}
          >
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full justify-center pt-8 sm:pt-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

