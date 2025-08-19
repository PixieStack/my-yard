"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, FileText, Heart, MessageSquare, MapPin, Building, AlertCircle, Calendar, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"

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
  township: {
    name: string
  }
  property_images: Array<{
    image_url: string
    is_primary: boolean
  }>
}

interface Application {
  id: string
  status: "pending" | "viewing_requested" | "viewing_scheduled" | "viewing_declined" | "approved" | "rejected"
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
  }
}

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
      // Fetch applications with enhanced status tracking
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, applied_at, property_id")
        .eq("tenant_id", profile?.id)
        .order("applied_at", { ascending: false })

      const applicationsWithProperties = await Promise.all(
        (applications || []).map(async (app) => {
          const { data: property } = await supabase
            .from("properties")
            .select("title, rent_amount")
            .eq("id", app.property_id)
            .maybeSingle()

          const { data: viewingRequest } = await supabase
            .from("viewing_requests")
            .select("requested_date, requested_time, status")
            .eq("property_id", app.property_id)
            .eq("tenant_id", profile?.id)
            .maybeSingle()

          return {
            ...app,
            property: property || { title: "Property Not Found", rent_amount: 0 },
            viewing_request: viewingRequest || null,
          }
        }),
      )

      // Fetch favorites
      const { data: favorites } = await supabase.from("favorites").select("id").eq("user_id", profile?.id)

      // Fetch messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("recipient_id", profile?.id)
        .eq("is_read", false)

      const { data: activeLease } = await supabase
        .from("leases")
        .select("id, monthly_rent, start_date, end_date")
        .eq("tenant_id", profile?.id)
        .eq("is_active", true)
        .maybeSingle()

      // Fetch recent properties (available ones)
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id, title, rent_amount, address, property_type, township_id")
        .eq("status", "available")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6)

      const propertiesWithDetails = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: township } = await supabase
            .from("townships")
            .select("name")
            .eq("id", property.township_id)
            .maybeSingle()

          const { data: images } = await supabase
            .from("property_images")
            .select("image_url, is_primary")
            .eq("property_id", property.id)

          return {
            ...property,
            township: township || { name: "Unknown" },
            property_images: images || [],
          }
        }),
      )

      const activeApplications =
        applicationsWithProperties?.filter((app) =>
          ["pending", "viewing_requested", "viewing_scheduled", "viewing_declined"].includes(app.status),
        ).length || 0

      const approvedApplications = applicationsWithProperties?.filter((app) => app.status === "approved").length || 0
      const viewingRequests =
        applicationsWithProperties?.filter((app) => ["viewing_requested", "viewing_scheduled"].includes(app.status))
          .length || 0

      const favoriteProperties = favorites?.length || 0
      const upcomingPayments = activeLease ? 1 : 0 // If has active lease, has upcoming payments
      const unreadMessages = messages?.length || 0

      setStats({
        activeApplications,
        approvedApplications,
        viewingRequests,
        favoriteProperties,
        upcomingPayments,
        unreadMessages,
      })

      setRecentProperties(propertiesWithDetails || [])
      setRecentApplications(applicationsWithProperties?.slice(0, 3) || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.first_name}!</h2>
          <p className="text-gray-600">Find your perfect township home today.</p>
        </div>
        <Link href="/tenant/properties">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse Properties
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedApplications > 0 ? `${stats.approvedApplications} approved` : "Pending review"}
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
            <CardTitle className="text-sm font-medium">Favorite Properties</CardTitle>
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
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{application.property?.title || "Property Not Available"}</h4>
                    <p className="text-sm text-gray-600">
                      {application.property?.rent_amount
                        ? formatCurrency(application.property.rent_amount)
                        : "Amount not available"}
                      /month
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </p>
                    {application.viewing_request && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Viewing: {new Date(application.viewing_request.requested_date).toLocaleDateString()} at{" "}
                        {new Date(`2000-01-01T${application.viewing_request.requested_time}`).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
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
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/tenant/properties">
            <CardHeader>
              <Search className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Browse Properties</CardTitle>
              <CardDescription>Find available properties in your preferred townships</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/tenant/favorites">
            <CardHeader>
              <Heart className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle className="text-lg">My Favorites</CardTitle>
              <CardDescription>View properties you've saved for later consideration</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/tenant/applications">
            <CardHeader>
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">My Applications</CardTitle>
              <CardDescription>Track the status of your rental applications</CardDescription>
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
              {recentProperties.map((property) => {
                const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url

                return (
                  <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-32">
                      {primaryImage ? (
                        <Image
                          src={primaryImage || "/placeholder.svg"}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-1 truncate">{property.title}</h4>
                      <p className="text-xs text-gray-600 mb-2 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.township?.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-green-600 font-semibold">
                          <span className="text-sm">{formatCurrency(property.rent_amount)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getPropertyTypeLabel(property.property_type)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent properties available</p>
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
          <CardDescription>A complete profile increases your chances of getting approved for rentals</CardDescription>
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
