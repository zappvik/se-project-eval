"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Initial check on mount
    supabase.auth.getUser().then(({ data }) => {
      setHasUser(!!data.user);
    });

    // Subscribe to auth state changes so button updates after login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasUser(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hide on login page or when there is no user
  if (!hasUser || pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setHasUser(false);
    router.push("/login");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-8 w-8 cursor-pointer border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 transition-transform"
      onClick={handleLogout}
      aria-label="Sign out"
      title="Sign out"
    >
      {/* simple door-with-arrow icon using SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 16l4-4m0 0-4-4m4 4H9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Button>
  );
}

