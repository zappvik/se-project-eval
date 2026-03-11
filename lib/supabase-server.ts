import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnvOrThrow } from "@/lib/supabase-env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const { url, anonKey } = getSupabaseEnvOrThrow();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<typeof cookieStore.set>[2];
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore errors when setting cookies from Server Components
        }
      },
    },
  });
}

