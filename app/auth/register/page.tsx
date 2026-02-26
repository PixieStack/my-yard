"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const defaultRole = searchParams.get('role') as 'tenant' | 'landlord' || 'tenant'
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"tenant" | "landlord">(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === 'landlord') {
        router.replace('/landlord/dashboard')
      } else {
        router.replace('/tenant/dashboard')
      }
    }
  }, [user, profile, authLoading, router])

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render register form if user is already logged in
  if (user) {
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      // Send custom verification email via Brevo SMTP
      try {
        await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: firstName }),
        })
      } catch (emailErr) {
        console.error("Verification email error:", emailErr)
      }

      setSuccess(true)
      setTimeout(() => {
        router.replace('/auth/login?registered=true')
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-orange-300/30 to-amber-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <Image 
            src="https://ffkvytgvdqipscackxyg.supabase.co/storage/v1/object/public/public-assets/my-yard-logo.png" 
            alt="MyYard" 
            width={50} 
            height={50} 
            className="group-hover:scale-110 transition-transform" 
          />
          <span className="ml-3 text-3xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            MyYard
          </span>
        </Link>

        <Card className="border-2 border-orange-200 shadow-2xl shadow-orange-500/20 bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-black text-slate-900">Create Account</CardTitle>
            <p className="text-slate-600 mt-2">Join thousands on MyYard</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">I am a:</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as "tenant" | "landlord")} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="tenant" id="tenant" className="peer sr-only" />
                    <Label
                      htmlFor="tenant"
                      className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-400 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-orange-100 peer-data-[state=checked]:to-amber-100 transition-all"
                    >
                      <Users className="h-8 w-8 text-orange-600 mb-2" />
                      <span className="font-bold text-slate-800">Tenant</span>
                      <span className="text-xs text-slate-600 mt-1">Looking for home</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="landlord" id="landlord" className="peer sr-only" />
                    <Label
                      htmlFor="landlord"
                      className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl cursor-pointer hover:border-orange-400 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-orange-100 peer-data-[state=checked]:to-amber-100 transition-all"
                    >
                      <Building2 className="h-8 w-8 text-orange-600 mb-2" />
                      <span className="font-bold text-slate-800">Landlord</span>
                      <span className="text-xs text-slate-600 mt-1">List properties</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 border-2 border-orange-200 focus:border-orange-500 bg-orange-50/50"
                      required
                      data-testid="register-firstname-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 border-2 border-orange-200 focus:border-orange-500 bg-orange-50/50"
                      required
                      data-testid="register-lastname-input"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-2 border-orange-200 focus:border-orange-500 bg-orange-50/50"
                    required
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-2 border-orange-200 focus:border-orange-500 bg-orange-50/50"
                    required
                    data-testid="register-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 border-2 border-orange-200 focus:border-orange-500 bg-orange-50/50"
                    required
                    data-testid="register-confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Account created! Check your email to verify. Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/30 group"
                data-testid="register-submit-btn"
              >
                {loading ? "Creating Account..." : "Create Account"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-bold">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-slate-600 hover:text-orange-600 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <RegisterContent />
    </Suspense>
  )
}
