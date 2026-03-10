"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function DashboardToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Clean up the query param so toast doesn't reappear
        const params = new URLSearchParams(searchParams.toString());
        params.delete("saved");
        router.replace(`/dashboard${params.toString() ? `?${params}` : ""}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 shadow-lg">
      Marks updated successfully.
    </div>
  );
}

