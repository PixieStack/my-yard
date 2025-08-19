"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/auth/login?error=callback_error")
          return
        }

        if (data.session?.user) {
          const user = data.session.user
          console.log("User session found:", user.id)

          // Check if profile exists
          let { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

          console.log("Profile fetch result:", { profile, profileError })

          if (!profile && !profileError) {
            console.log("No profile found, creating one...")

            const role = user.user_metadata?.role || "tenant"
            const firstName = user.user_metadata?.first_name || ""
            const lastName = user.user_metadata?.last_name || ""
            const phone = user.user_metadata?.phone || ""

            console.log("Creating profile with data:", { role, firstName, lastName, phone })
            console.log("User ID:", user.id)
            console.log("User email:", user.email)
            console.log("Full user metadata:", user.user_metadata)

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                phone,
                role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .maybeSingle()

            if (createError) {
              console.error("Error creating profile:", createError)
              console.error("Profile creation failed with details:", {
                code: createError.code,
                message: createError.message,
                details: createError.details,
                hint: createError.hint,
              })
              const errorMessage = createError.message.includes("duplicate key")
                ? "User profile already exists"
                : `Database error saving new user: ${createError.message}`
              router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
              return
            }

            console.log("Profile created successfully:", newProfile)

            if (role === "tenant") {
              console.log("Creating tenant profile...")
              const { data: existingTenant } = await supabase
                .from("tenant_profiles")
                .select("id")
                .eq("id", user.id)
                .maybeSingle()

              if (!existingTenant) {
                const { error: tenantError } = await supabase.from("tenant_profiles").insert({
                  id: user.id,
                  date_of_birth: null,
                  id_number: "",
                  current_address: "",
                  city: "",
                  province: "",
                  postal_code: "",
                  employment_status: "unemployed",
                  employer_name: "",
                  job_title: "",
                  monthly_income: 0,
                  employment_duration_months: 0,
                  previous_landlord_contact: "",
                  emergency_contact_name: "",
                  emergency_contact_phone: "",
                  emergency_contact_relationship: "",
                  has_pets: false,
                  pet_details: "",
                  smoking: false,
                  preferred_areas: [],
                  max_budget: 0,
                  preferred_move_in_date: null,
                  rating: 0.0,
                  total_reviews: 0,
                  applications_count: 0,
                  successful_rentals: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })

                if (tenantError) {
                  console.error("Error creating tenant profile:", tenantError)
                  console.error("Tenant profile creation failed:", {
                    code: tenantError.code,
                    message: tenantError.message,
                    details: tenantError.details,
                    hint: tenantError.hint,
                  })
                } else {
                  console.log("Tenant profile created successfully")
                }
              } else {
                console.log("Tenant profile already exists")
              }
            } else if (role === "landlord") {
              console.log("Creating landlord profile...")
              const { data: existingLandlord } = await supabase
                .from("landlord_profiles")
                .select("id")
                .eq("id", user.id)
                .maybeSingle()

              if (!existingLandlord) {
                const { error: landlordError } = await supabase.from("landlord_profiles").insert({
                  id: user.id,
                  business_name: "",
                  business_registration_number: "",
                  tax_number: "",
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

                if (landlordError) {
                  console.error("Error creating landlord profile:", landlordError)
                  console.error("Landlord profile creation failed:", {
                    code: landlordError.code,
                    message: landlordError.message,
                    details: landlordError.details,
                    hint: landlordError.hint,
                  })
                } else {
                  console.log("Landlord profile created successfully")
                }
              } else {
                console.log("Landlord profile already exists")
              }
            }

            profile = { role }
          }

          // Redirect based on role
          console.log("Redirecting user with role:", profile?.role)
          if (profile?.role === "landlord") {
            router.push("/landlord/dashboard")
          } else {
            router.push("/tenant/dashboard")
          }
        } else {
          router.push("/auth/login")
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        router.push("/auth/login?error=unexpected_error")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing your sign in...</p>
      </div>
    </div>
  )
}
