import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export type AuthUser = User | null;

export interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOTP: (
    emailOrPhone: string,
    token: string,
    type: "email" | "sms"
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

let inFlightUserPromise: Promise<User | null> | null = null;

// Fast user getter: prefers cached session, de-dupes network fetches
export const getUserFast = async (): Promise<User | null> => {
  // Try session first (no network)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // Fall back to network, but de-duplicate parallel calls
  if (!inFlightUserPromise) {
    inFlightUserPromise = supabase.auth
      .getUser()
      .then(({ data }) => data.user ?? null)
      .finally(() => {
        inFlightUserPromise = null;
      });
  }
  return inFlightUserPromise;
};

// Sign in with email OTP
export const signInWithEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // You can customize the email template in Supabase dashboard
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

// Sign in with phone OTP
export const signInWithPhone = async (phone: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

// Verify OTP
export const verifyOTP = async (
  emailOrPhone: string,
  token: string,
  type: "email" | "sms"
) => {
  try {
    let params;
    if (type === "email") {
      params = {
        email: emailOrPhone,
        token,
        type: "email" as const,
      };
    } else {
      params = {
        phone: emailOrPhone,
        token,
        type: "sms" as const,
      };
    }

    const { error } = await supabase.auth.verifyOtp(params);

    // After successful verification, ensure profile and username
    if (!error) {
      await ensureProfileWithUsername();
    }

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

// Verify phone OTP
export const verifyPhoneOTP = async (phone: string, token: string) => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error.message);
  }
};

// Get current user (fast path)
export const getCurrentUser = async () => {
  const user = await getUserFast();
  if (user) {
    // Opportunistically ensure username exists
    await ensureProfileWithUsername();
  }
  return user;
};

// Listen to auth changes
export const onAuthStateChange = (callback: (user: AuthUser) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
};

// Ensure a profile row exists and assign a unique, human-friendly username from email
export const ensureProfileWithUsername = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const base = (user.email || "").split("@")[0] || "user";
  const sanitized =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user";

  // Load existing profile, supporting both id and user_id schemas and optional name column
  let prof: { user_id?: string; id?: string; name?: string } | null = null;
  const initial = await supabase
    .from("profiles")
    .select("user_id, id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  prof =
    (initial.data as { user_id?: string; id?: string; name?: string } | null) ||
    null;

  if (!prof) {
    const retry = await supabase
      .from("profiles")
      .select("user_id, id, name")
      .eq("id", user.id)
      .maybeSingle();
    prof =
      (retry.data as {
        user_id?: string;
        id?: string;
        name?: string;
      } | null) || null;
  }

  // If profile exists and has a name, nothing to do
  if (
    prof &&
    typeof (prof as { name?: string }).name === "string" &&
    (prof as { name?: string }).name
  )
    return;

  // Find a unique username by appending a counter if needed
  let candidate = sanitized;
  for (let i = 0; i < 50; i++) {
    const { count } = await supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      // Try both columns where name might live
      .or(`name.eq.${candidate},full_name.eq.${candidate}`);
    if ((count || 0) === 0) break;
    candidate = `${sanitized}-${i + 1}`.slice(0, 28);
  }

  // Upsert profile with name; support both key columns
  const payload: Record<string, unknown> = {
    name: candidate,
    updated_at: new Date().toISOString(),
  };
  // Prefer user_id, but if table uses id as PK referencing auth.users.id, also include it
  payload.user_id = user.id;
  try {
    // First try schema with `name`
    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      // If `name` column isn't present, retry with `full_name`
      if (msg.includes("column") && msg.includes("name")) {
        const altPayload: Record<string, unknown> = {
          full_name: candidate,
          updated_at: new Date().toISOString(),
          user_id: user.id,
        };
        const alt = await supabase.from("profiles").upsert(altPayload);
        if (alt.error) {
          // last resort: PK named `id`
          await supabase
            .from("profiles")
            .upsert({ id: user.id, ...altPayload });
        }
      } else {
        // Attempt fallback where the PK column is `id` instead of `user_id`
        await supabase.from("profiles").upsert({ id: user.id, ...payload });
      }
    }
  } catch {
    // ignore
  }
};
