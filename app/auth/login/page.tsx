"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setShowResendConfirmation(false)

    try {
      console.log("Attempting login for:", email)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("Auth error:", authError)

        if (
          authError.message === "Email not confirmed" ||
          authError.message.includes("email not confirmed") ||
          authError.message.includes("Email not confirmed") ||
          authError.code === "email_not_confirmed"
        ) {
          setError("Please check your email and click the confirmation link before signing in.")
          setShowResendConfirmation(true)
          setLoading(false)
          return
        }

        throw authError
      }

      if (!authData.user) {
        throw new Error("No user data returned")
      }

      console.log("User authenticated successfully:", authData.user.id)
      console.log("User metadata:", authData.user.user_metadata)

      // Try to fetch existing profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw new Error("Failed to fetch user profile")
      }

      console.log("Profile found:", profile)

      // If no profile exists, create one using user metadata
      if (!profile) {
        console.log("No profile found, creating profile for user with role:", authData.user.user_metadata?.role)

        const userRole = authData.user.user_metadata?.role || "tenant"
        const firstName = authData.user.user_metadata?.firstName || ""
        const lastName = authData.user.user_metadata?.lastName || ""

        // Create base profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            email: authData.user.email,
            role: userRole,
            is_active: true,
            is_verified: false,
            email_verified: authData.user.email_confirmed_at ? true : false,
            phone_verified: false,
          })
          .select()
          .single()

        if (createProfileError) {
          console.error("Error creating profile:", createProfileError)
          console.error("Error details:", {
            code: createProfileError.code,
            message: createProfileError.message,
            details: createProfileError.details,
            hint: createProfileError.hint,
          })
          throw new Error("Failed to create user profile")
        }

        console.log("Base profile created successfully:", newProfile)

        // Create role-specific profile
        if (userRole === "tenant") {
          const { data: tenantProfile, error: tenantError } = await supabase
            .from("tenant_profiles")
            .insert({
              id: authData.user.id,
              date_of_birth: null,
              id_number: null,
              current_address: null,
              city: null,
              province: null,
              postal_code: null,
              employment_status: "unemployed",
              employer_name: null,
              job_title: null,
              monthly_income: 0,
              employment_duration_months: 0,
              emergency_contact_name: null,
              emergency_contact_phone: null,
              emergency_contact_relationship: null,
              has_pets: false,
              pet_details: null,
              smoking_status: "non_smoker",
              preferred_move_in_date: null,
              lease_duration_preference: 12,
              max_budget: 0,
              preferred_areas: null,
              transportation_method: null,
              previous_rental_history: null,
              references: null,
              additional_notes: null,
              rating: 0.0,
              total_reviews: 0,
              background_check_status: "pending",
              credit_score: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (tenantError) {
            console.error("Error creating tenant profile:", tenantError)
            console.error("Tenant error details:", {
              code: tenantError.code,
              message: tenantError.message,
              details: tenantError.details,
              hint: tenantError.hint,
            })
            throw new Error("Failed to create tenant profile: " + tenantError.message)
          } else {
            console.log("Tenant profile created successfully:", tenantProfile)
          }
        } else if (userRole === "landlord") {
          const { data: landlordProfile, error: landlordError } = await supabase
            .from("landlord_profiles")
            .insert({
              id: authData.user.id,
              business_name: null,
              business_registration_number: null,
              tax_number: null,
              years_experience: 0,
              total_properties: 0,
              active_properties: 0,
              occupied_properties: 0,
              rating: 0.0,
              total_reviews: 0,
              response_time_hours: 24,
              accepts_pets: false,
              allows_smoking: false,
              preferred_tenant_type: "any",
              minimum_lease_months: 12,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (landlordError) {
            console.error("Error creating landlord profile:", landlordError)
            console.error("Landlord error details:", {
              code: landlordError.code,
              message: landlordError.message,
              details: landlordError.details,
              hint: landlordError.hint,
            })
            throw new Error("Failed to create landlord profile: " + landlordError.message)
          } else {
            console.log("Landlord profile created successfully:", landlordProfile)
          }
        }

        console.log("All profiles created successfully, proceeding with redirect")
      }

      // Redirect based on role
      const userRole = profile?.role || authData.user.user_metadata?.role || "tenant"
      console.log("Redirecting user with role:", userRole)

      if (userRole === "landlord") {
        router.push("/landlord/dashboard")
      } else {
        router.push("/tenant/dashboard")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setError("Confirmation email sent! Please check your inbox.")
      setShowResendConfirmation(false)
    } catch (error: any) {
      setError(error.message || "Failed to resend confirmation email")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/95 shadow-2xl border-0 ring-1 ring-slate-200/50">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Home className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              MyYard
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-800 mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-slate-600 text-base">
            Sign in to your MyYard account and continue your rental journey
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {showResendConfirmation && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendConfirmation}
                  className="text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                >
                  Resend Confirmation Email
                </Button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
              >
                Create Account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
