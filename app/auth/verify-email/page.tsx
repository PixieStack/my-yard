"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Mail } from "lucide-react"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const autoCode = searchParams.get("code")

  const [code, setCode] = useState(autoCode || "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token && autoCode) {
      verifyCode(autoCode)
    }
  }, [token, autoCode])

  const verifyCode = async (verifyCode: string) => {
    setLoading(true)
    setError("")
    try {
      if (!token) {
        setError("Invalid verification link")
        return
      }

      const decoded = JSON.parse(atob(token))
      const { email, code: expectedCode, expires } = decoded

      if (new Date(expires) < new Date()) {
        setError("Verification code has expired. Please request a new one.")
        return
      }

      if (verifyCode !== expectedCode) {
        setError("Invalid verification code. Please check and try again.")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login?verified=true")
      }, 2000)
    } catch {
      setError("Invalid verification link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image 
            src="https://ffkvytgvdqipscackxyg.supabase.co/storage/v1/object/public/public-assets/my-yard-logo.png" 
            alt="MyYard" 
            width={50} 
            height={50} 
          />
          <span className="ml-3 text-3xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            MyYard
          </span>
        </Link>

        <Card className="border-2 border-orange-200 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <Mail className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Enter the 6-digit code sent to your email</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email verified successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono border-2 border-orange-200 py-6"
                  maxLength={6}
                  data-testid="verify-code-input"
                />

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => verifyCode(code)}
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 py-6 text-lg font-bold"
                  data-testid="verify-submit-btn"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </>
            )}

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
