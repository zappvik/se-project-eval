"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChangePasswordLink() {
  const pathname = usePathname();

  // Hide on login and evaluate pages
  if (pathname === "/login" || pathname.startsWith("/evaluate/")) {
    return null;
  }

  return (
    <Link
      href="/change-password"
      className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 touch-manipulation"
    >
      Change password
    </Link>
  );
}

