"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Failsafe: session resolution shouldn't take more than 5s
    const failsafe = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id, session);
        } else {
          setUser(null);
          setLoading(false);
          clearTimeout(failsafe);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, []);

  async function fetchUserProfile(userId: string, session: Session) {
    try {
      const res = await fetch(`/api/auth/profile?id=${userId}`);
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 404) {
        // Profile doesn't exist, create it via server
        const meta = session.user.user_metadata;
        const newProfile = {
          id: userId,
          name: meta?.name ?? session.user.email?.split("@")[0] ?? "User",
          email: session.user.email ?? "",
          role: (meta?.role as string) ?? "teacher",
        };
        
        const createRes = await fetch("/api/auth/profile", {
          method: "POST",
          body: JSON.stringify({ profile: newProfile }),
        });
        
        if (createRes.ok) {
          const createdData = await createRes.json();
          setUser(createdData);
        }
      }
    } catch (err) {
      console.error("Auth: profile error", err);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
