"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { useRouter } from "next/navigation"

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = async (userId: string, signal?: AbortSignal): Promise<Profile | null> => {
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (signal?.aborted) return null
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

        if (error) {
          const message = error.message || error.code || JSON.stringify(error)
          console.error(`Error fetching profile (attempt ${attempt + 1}/${maxRetries}): ${message}`)
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 500ms, 1000ms
            await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
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
        const message = err instanceof Error ? err.message : JSON.stringify(err)
        console.error(`Unexpected error fetching profile (attempt ${attempt + 1}/${maxRetries}): ${message}`)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
          continue
        }
        return null
      }
    }
    return null
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // Track the current in-flight fetch so we can cancel it when auth state changes again
    let abortController: AbortController | null = null

    // Use only onAuthStateChange — it fires INITIAL_SESSION on mount, which
    // covers the same ground as a separate getSession() call and avoids the
    // Navigator LockManager contention caused by running both simultaneously.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Cancel any previous in-flight profile fetch
      abortController?.abort()
      abortController = new AbortController()
      const { signal } = abortController

      try {
        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id, signal)
          if (!signal.aborted) {
            setProfile(profileData)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error)
        console.error("Error in auth state change:", message)
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    })

    return () => {
      abortController?.abort()
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
      // Still redirect even if there's an error
      router.push("/auth/login")
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
