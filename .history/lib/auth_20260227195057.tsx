"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: "tenant" | "landlord"
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // ✅ Refs to prevent duplicate fetches and track mount state
  const mounted = useRef(true)
  const fetchingProfile = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ─── Fetch Profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(
    async (userId: string, signal?: AbortSignal): Promise<Profile | null> => {
      const maxRetries = 3

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (signal?.aborted) return null

        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle()

          if (signal?.aborted) return null

          if (error) {
            const message = error.message || error.code || JSON.stringify(error)
            console.error(
              `Error fetching profile (attempt ${attempt + 1}/${maxRetries}): ${message}`
            )
            if (attempt < maxRetries - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * Math.pow(2, attempt))
              )
              continue
            }
            return null
          }

          if (!data) {
            console.warn("Profile not found for user:", userId)
            return null
          }

          return data as Profile
        } catch (err) {
          if (signal?.aborted) return null
          const message = err instanceof Error ? err.message : JSON.stringify(err)
          console.error(
            `Unexpected error fetching profile (attempt ${attempt + 1}/${maxRetries}): ${message}`
          )
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * Math.pow(2, attempt))
            )
            continue
          }
          return null
        }
      }

      return null
    },
    []
  )

  // ─── Refresh Profile ────────────────────────────────────────────────────────

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    // ✅ Reset guard to allow manual refresh
    fetchingProfile.current = false

    const profileData = await fetchProfile(user.id)
    if (mounted.current) {
      setProfile(profileData)
    }
  }, [user?.id, fetchProfile])

  // ─── Auth State Listener ────────────────────────────────────────────────────

  useEffect(() => {
    mounted.current = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ Cancel any previous in-flight profile fetch
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      const { signal } = abortControllerRef.current

      try {
        if (session?.user) {
          if (mounted.current) setUser(session.user)

          // ✅ Guard: don't fetch profile if already fetching
          if (!fetchingProfile.current) {
            fetchingProfile.current = true
            const profileData = await fetchProfile(session.user.id, signal)
            if (!signal.aborted && mounted.current) {
              setProfile(profileData)
              fetchingProfile.current = false
            }
          }
        } else {
          if (mounted.current) {
            setUser(null)
            setProfile(null)
            fetchingProfile.current = false
          }
        }
      } catch (error) {
        if (signal.aborted) return
        const message = error instanceof Error ? error.message : JSON.stringify(error)
        console.error("Error in auth state change:", message)
      } finally {
        if (!signal.aborted && mounted.current) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted.current = false
      fetchingProfile.current = false
      abortControllerRef.current?.abort()
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ─── Sign Out ───────────────────────────────────────────────────────────────

  const signOut = async () => {
    try {
      // ✅ Clear state first
      if (mounted.current) {
        setUser(null)
        setProfile(null)
      }

      // ✅ Cancel any in-flight fetches
      abortControllerRef.current?.abort()
      fetchingProfile.current = false

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("myyard-auth-token")
        sessionStorage.clear()
      }

      // Redirect
      router.replace("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
  }

  // ─── Provide ────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}