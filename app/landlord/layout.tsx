"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Building, Users, FileText, CreditCard, MessageSquare, Settings, LogOut, ScrollText } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/landlord/dashboard", icon: Home },
  { name: "Properties", href: "/landlord/properties", icon: Building },
  { name: "Tenants", href: "/landlord/tenants", icon: Users },
  { name: "Applications", href: "/landlord/applications", icon: FileText },
  { name: "Leases", href: "/landlord/leases", icon: ScrollText },
  { name: "Payments", href: "/landlord/payments", icon: CreditCard },
  { name: "Messages", href: "/landlord/messages", icon: MessageSquare },
  { name: "Settings", href: "/landlord/settings", icon: Settings },
]

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <AuthGuard requiredRole="landlord">
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b">
              <Link href="/landlord/dashboard" className="flex items-center space-x-2">
                <Image
                  src="https://ffkvytgvdqipscackxyg.supabase.co/storage/v1/object/public/public-assets/my-yard-logo.png"
                  alt="MyYard"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900">MyYard</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User Profile */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {profile?.first_name?.[0]}
                    {profile?.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Landlord</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
              <div className="flex items-center space-x-4">
                <NotificationBell />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
