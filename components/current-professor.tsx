"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export function CurrentProfessor() {
  const pathname = usePathname();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/evaluate/")) {
      setLabel(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const user = data.user;
        if (!user) {
          setLabel(null);
          return;
        }

        // Try to load professor profile for a nicer display name.
        const { data: professor } = await supabase
          .from("professors")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();

        if (professor?.name) {
          setLabel(professor.name);
        } else {
          setLabel(user.email ?? null);
        }
      })
      .catch(() => {
        setLabel(null);
      });
  }, [pathname]);

  if (!label || pathname === "/login" || pathname.startsWith("/evaluate/")) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 min-w-0">
      <span className="rounded-full bg-zinc-100 px-2.5 py-1.5 font-medium text-zinc-700 truncate max-w-[120px] sm:max-w-[180px]">
        {label}
      </span>
    </div>
  );
}


