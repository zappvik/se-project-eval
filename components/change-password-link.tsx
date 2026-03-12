"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChangePasswordLink() {
  const pathname = usePathname();

  // Hide on login, evaluate, downloads, and change-password pages
  if (
    pathname === "/login" ||
    pathname.startsWith("/evaluate/") ||
    pathname === "/downloads" ||
    pathname === "/change-password"
  ) {
    return null;
  }

  return (
    <Link
      href="/change-password"
      className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs sm:text-sm font-medium text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 touch-manipulation"
    >
      Change password
    </Link>
  );
}

