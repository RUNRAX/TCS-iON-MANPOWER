import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase server client — for Server Components & API Routes
 * Uses cookie-based auth with anon key
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component — cannot set cookies (handled by middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Server Component — cannot remove cookies (handled by middleware)
          }
        },
      },
    }
  );
}

/**
 * Supabase admin client — singleton per process.
 * Re-creating this on every request was the main source of latency:
 * each call re-initialised the auth client and HTTP agent.
 * Caching it at module level reuses the underlying connection pool.
 */
let _adminClient: ReturnType<typeof createServerClient> | null = null;

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  if (_adminClient) return _adminClient;

  _adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Keep HTTP connections alive between requests
        fetch: (url: any, options: any = {}) =>
          fetch(url, { ...options, keepalive: true }),
      },
    }
  );

  return _adminClient;
}

/**
 * Get the current session server-side
 * Returns null if no session
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

/**
 * Get the current user server-side
 * More secure than getSession — validates JWT with Supabase
 */
export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Get user role from the users table
 */
export async function getUserRole(userId: string): Promise<"admin" | "employee" | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data.role as "admin" | "employee";
}
