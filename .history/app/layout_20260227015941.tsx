import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "MyYard - Township Rental Marketplace",
  description:
    "Find your perfect township home in South Africa. Connect with verified landlords and tenants through our secure, community-focused rental platform.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning> {/* ✅ Fixes Grammarly hydration mismatch */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}