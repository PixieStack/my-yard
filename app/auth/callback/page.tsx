"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()

          if (profile?.role === "landlord") {
            router.push("/landlord/dashboard")
          } else if (profile?.role === "tenant") {
            router.push("/tenant/dashboard")
          } else {
            const meta = session.user.user_metadata || {}
            await supabase.from("profiles").upsert({
              id: session.user.id,
              email: session.user.email,
              first_name: meta.full_name?.split(" ")[0] || meta.firstName || "",
              last_name: meta.full_name?.split(" ").slice(1).join(" ") || meta.lastName || "",
              role: meta.role || "tenant",
              avatar_url: meta.avatar_url || meta.picture || "",
            })
            router.push("/tenant/dashboard")
          }
        } else {
          router.push("/auth/login")
        }
      } catch (err: any) {
        console.error("Auth callback error:", err)
        setError(err.message)
        setTimeout(() => router.push("/auth/login"), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 font-semibold">{error}</p>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600 font-semibold">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  )
}
