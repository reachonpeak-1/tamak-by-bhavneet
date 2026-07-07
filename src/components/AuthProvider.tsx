"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pw: string) => Promise<void>;
  signUpEmail: (email: string, pw: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // loading starts true only when Firebase is configured (else nothing to load)
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(getClientAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    configured: isFirebaseConfigured,
    signInGoogle: async () => {
      try {
        await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      } catch (err: unknown) {
        const error = err as any;
        // Popup blocked — use redirect instead
        if (error?.code === "auth/popup-blocked") {
          await signInWithRedirect(getClientAuth(), new GoogleAuthProvider());
        }
        // For other errors, provide user feedback
        if (error?.code && error.code !== "auth/popup-blocked") {
          throw new Error("Google sign-in failed. Please check your browser permissions and try again.");
        }
        throw error;
      }
    },
    signInEmail: async (email, pw) => {
      await signInWithEmailAndPassword(getClientAuth(), email, pw);
    },
    signUpEmail: async (email, pw) => {
      await createUserWithEmailAndPassword(getClientAuth(), email, pw);
    },
    signOut: async () => {
      await fbSignOut(getClientAuth());
    },
    getToken: async () => (user ? user.getIdToken(true) : null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
