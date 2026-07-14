"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Adapter shape kept compatible with the old Firebase user consumers
// (account page reads displayName / email / photoURL).
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  metadata: { creationTime?: string };
}

function toAuthUser(u: SupabaseUser | null): AuthUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: meta.full_name ?? meta.name ?? null,
    photoURL: meta.avatar_url ?? meta.picture ?? null,
    metadata: { creationTime: u.created_at },
  };
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signInGoogle: (next?: string) => Promise<void>;
  signInEmail: (email: string, pw: string) => Promise<void>;
  signUpEmail: (email: string, pw: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // loading starts true only when Supabase is configured (else nothing to load)
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getBrowserClient();
    // Fires INITIAL_SESSION immediately, then on every sign-in/out/refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    configured: isSupabaseConfigured,
    signInGoogle: async (next: string = "/") => {
      // Route through our own server-side callback (exchangeCodeForSession)
      // rather than relying on the browser client's automatic ?code=
      // detection, which silently no-ops if it can't find its own PKCE
      // code-verifier in storage at the right moment.
      const { error } = await getBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw new Error("Google sign-in failed. Please try again.");
    },
    signInEmail: async (email, pw) => {
      const { error } = await getBrowserClient().auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error(error.message);
    },
    signUpEmail: async (email, pw) => {
      const { error } = await getBrowserClient().auth.signUp({ email, password: pw });
      if (error) throw new Error(error.message);
    },
    signOut: async () => {
      await getBrowserClient().auth.signOut();
    },
    // Fresh Supabase access token for Bearer-guarded admin/API calls.
    getToken: async () => {
      const { data } = await getBrowserClient().auth.getSession();
      return data.session?.access_token ?? null;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
