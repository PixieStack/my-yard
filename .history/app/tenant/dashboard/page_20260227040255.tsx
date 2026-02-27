"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  FileText,
  Heart,
  MessageSquare,
  MapPin,
  Building,
  AlertCircle,
  Calendar,
  Eye,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantStats {
  activeApplications: number
  approvedApplications: number
  viewingRequests: number
  favoriteProperties: number
  upcomingPayments: number
  unreadMessages: number
}

interface RecentProperty {
  id: string
  title: string
  rent_amount: number
  address: string
  property_type: string
  location_name: string | null
  location_city: string | null
  location_province: string | null
  city: string | null
  province: string | null
  property_images: Array<{
    image_url: string
    is_primary: boolean
    display_order: number
  }>
}

interface Application {
  id: string
  status:
    | "pending"
    | "viewing_requested"
    | "viewing_scheduled"
    | "viewing_declined"
    | "approved"
    | "rejected"
  applied_at: string
  property_id: string
  property: {
    title: string
    rent_amount: number
  } | null
  viewing_request?: {
    requested_date: string
    requested_time: string
    status: string
  } | null
}

// ─── PropertyImage component ──────────────────────────────────────────────────

function PropertyImage({
  images,
  title,
  className = "",
}: {
  images: Array<{ image_url: string; is_primary: boolean; display_order: number }>
  title: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)

  const sorted = [...(images || [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })

  const src = sorted[0]?.image_url

  if (!src || errored) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className}`}
      >
        <Building className="h-8 w-8 text-gray-400 mb-1" />
        <span className="text-xs text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className={`object-cover ${className}`}
      onError={() => setErrored(true)}
    />
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<TenantStats>({
    activeApplications: 0,
    approvedApplications: 0,
    viewingRequests: 0,
    favoriteProperties: 0,
    upcomingPayments: 0,
    unreadMessages: 0,
  })
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([])
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData()
    }
  }, [profile?.id])

  const fetchDashboardData = async () => {
    try {
      // ── All queries fired in parallel ──────────────────────────────────────

      const [
        applicationsResult,
        favoritesResult,
        messagesResult,
        leaseResult,
        propertiesResult,
      ] = await Promise.all([
        // Applications — joined with property in one query
        supabase
          .from("applications")
          .select(
            `
            id, status, applied_at, property_id,
            property:properties (
              title,
              rent_amount
            )
          `
          )
          .eq("tenant_id", profile!.id)
          .order("applied_at", { ascending: false }),

        // Favorites count
        supabase
          .from("favorites")
          .select("id")
          .eq("user_id", profile!.id),

        // Unread messages count
        supabase
          .from("messages")
          .select("id")
          .eq("recipient_id", profile!.id)
          .eq("is_read", false),

        // Active lease check
        supabase
          .from("leases")
          .select("id")
          .eq("tenant_id", profile!.id)
          .eq("is_active", true)
          .maybeSingle(),

        // Recent available properties — images joined in one query
        supabase
          .from("properties")
          .select(
            `
            id, title, rent_amount, address, property_type,
            location_name, location_city, location_province,
            city, province,
            property_images (
              image_url, is_primary, display_order
            )
          `
          )
          .eq("status", "available")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6),
      ])

      const applications = applicationsResult.data || []

      // ── Viewing requests — one batch query instead of per-application ──────
      const propertyIds = applications.map((a) => a.property_id).filter(Boolean)

      let viewingRequestsMap: Record<string, { requested_date: string; requested_time: string; status: string }> = {}

      if (propertyIds.length > 0) {
        const { data: viewingData } = await supabase
          .from("viewing_requests")
          .select("property_id, requested_date, requested_time, status")
          .eq("tenant_id", profile!.id)
          .in("property_id", propertyIds)

        if (viewingData) {
          viewingData.forEach((vr) => {
            viewingRequestsMap[vr.property_id] = {
              requested_date: vr.requested_date,
              requested_time: vr.requested_time,
              status: vr.status,
            }
          })
        }
      }

      // ── Merge viewing requests into applications ───────────────────────────
      const applicationsWithViewing: Application[] = applications.map((app) => ({
        id: app.id,
        status: app.status as Application["status"],
        applied_at: app.applied_at,
        property_id: app.property_id,
        property: Array.isArray(app.property)
          ? app.property[0] ?? null
          : (app.property as { title: string; rent_amount: number } | null),
        viewing_request: viewingRequestsMap[app.property_id] ?? null,
      }))

      // ── Compute stats ──────────────────────────────────────────────────────
      const activeStatuses = [
        "pending",
        "viewing_requested",
        "viewing_scheduled",
        "viewing_declined",
      ]
      const viewingStatuses = ["viewing_requested", "viewing_scheduled"]

      const activeApplications = applicationsWithViewing.filter((a) =>
        activeStatuses.includes(a.status)
      ).length

      const approvedApplications = applicationsWithViewing.filter(
        (a) => a.status === "approved"
      ).length

      const viewingRequests = applicationsWithViewing.filter((a) =>
        viewingStatuses.includes(a.status)
      ).length

      setStats({
        activeApplications,
        approvedApplications,
        viewingRequests,
        favoriteProperties: favoritesResult.data?.length ?? 0,
        upcomingPayments: leaseResult.data ? 1 : 0,
        unreadMessages: messagesResult.data?.length ?? 0,
      })

      setRecentApplications(applicationsWithViewing.slice(0, 3))
      setRecentProperties((propertiesResult.data as RecentProperty[]) || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "viewing_requested":
        return "bg-blue-100 text-blue-800"
      case "viewing_scheduled":
        return "bg-purple-100 text-purple-800"
      case "viewing_declined":
        return "bg-orange-100 text-orange-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Under Review"
      case "viewing_requested":
        return "Viewing Requested"
      case "viewing_scheduled":
        return "Viewing Scheduled"
      case "viewing_declined":
        return "Ready for Decision"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "room":
        return "Room"
      case "bachelor":
        return "Bachelor"
      case "cottage":
        return "Cottage"
      default:
        return type
    }
  }

  const getLocationDisplay = (p: RecentProperty) => {
    if (p.location_name) {
      return [p.location_name, p.location_city].filter(Boolean).join(", ")
    }
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.first_name}!
          </h2>
          <p className="text-gray-600">Find your perfect township home today.</p>
        </div>
        <Link href="/tenant/properties">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse Properties
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedApplications > 0
                ? `${stats.approvedApplications} approved`
                : "Pending review"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewing Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewingRequests}</div>
            <p className="text-xs text-muted-foreground">Scheduled viewings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favourite Properties</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteProperties}</div>
            <p className="text-xs text-muted-foreground">Saved for later</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">New messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      {recentApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Track the status of your property applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-4 border rounded-lg gap-4 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {application.property?.title || "Property Not Available"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {application.property?.rent_amount
                        ? `${formatCurrency(application.property.rent_amount)}/month`
                        : "Amount not available"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied{" "}
                      {new Date(application.applied_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {application.viewing_request && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Viewing:{" "}
                        {new Date(
                          application.viewing_request.requested_date
                        ).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(
                          `2000-01-01T${application.viewing_request.requested_time}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Badge className={getApplicationStatusColor(application.status)}>
                      {getStatusText(application.status)}
                    </Badge>
                    <Link href={`/tenant/applications/${application.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/tenant/applications">
                <Button variant="outline" size="sm">
                  View All Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/tenant/properties">
            <CardHeader>
              <Search className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Browse Properties</CardTitle>
              <CardDescription>
                Find available properties in your preferred townships
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/tenant/favorites">
            <CardHeader>
              <Heart className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle className="text-lg">My Favourites</CardTitle>
              <CardDescription>
                View properties you've saved for later consideration
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/tenant/applications">
            <CardHeader>
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">My Applications</CardTitle>
              <CardDescription>
                Track the status of your rental applications
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recently Added Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Added Properties</CardTitle>
          <CardDescription>New properties that might interest you</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProperties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/tenant/properties/${property.id}`}
                  className="block group"
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                    <div className="relative h-36 overflow-hidden">
                      <PropertyImage
                        images={property.property_images}
                        title={property.title}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-1 truncate">{property.title}</h4>
                      <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{getLocationDisplay(property)}</span>
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(property.rent_amount)}
                          <span className="text-xs text-gray-500 font-normal">/mo</span>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getPropertyTypeLabel(property.property_type)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No recent properties available</p>
            </div>
          )}
          <div className="mt-4">
            <Link href="/tenant/properties">
              <Button variant="outline" size="sm">
                View All Properties
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <AlertCircle className="mr-2 h-5 w-5" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            A complete profile increases your chances of getting approved for rentals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">60%</span>
            </div>
            <Progress value={60} className="h-2" />
            <p className="text-sm text-gray-600">
              Add employment details, references, and documents to improve your profile
            </p>
            <Link href="/tenant/settings">
              <Button size="sm">Complete Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}