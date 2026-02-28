"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Search,
  MapPin,
  Calendar,
  Eye,
  Building,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"

interface ApplicationPayload {
  id: string
  tenant_id: string
  property_id: string
  status: ApplicationStatus
  applied_at: string
  preferred_move_in_date: string | null
  lease_duration_months: number | null
  cover_letter: string | null
  rejection_reason: string | null
}

interface PropertyData {
  id: string
  title: string
  rent_amount: number
  address: string
  property_type: string
  landlord_id: string
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
  status: ApplicationStatus
  applied_at: string
  // ← actual DB column names
  preferred_move_in_date: string | null
  lease_duration_months: number | null
  cover_letter: string | null
  rejection_reason: string | null
  property_id: string
  property: PropertyData | null
  landlord: {
    first_name: string
    last_name: string
  } | null
}

interface ViewingRequest {
  id: string
  property_id: string
  requested_date: string
  requested_time: string
  status: "pending" | "requested" | "confirmed" | "completed" | "cancelled"
  tenant_message: string | null
  landlord_message: string | null
  created_at: string
  property: PropertyData | null
  landlord: {
    first_name: string
    last_name: string
  } | null
}

// ─── PropertyImage ────────────────────────────────────────────────────────────

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
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <Building className="h-8 w-8 text-gray-400" />
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchApplications = useCallback(async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      setPageError("")

      // ── Step 1: Fetch applications with actual column names ───────────────
      const { data: appsRaw, error: appsError } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          applied_at,
          preferred_move_in_date,
          lease_duration_months,
          cover_letter,
          rejection_reason,
          property_id
        `)
        .eq("tenant_id", profile.id)
        .order("applied_at", { ascending: false })

      if (appsError) {
        console.error("App error message:", appsError.message)
        console.error("App error code:", appsError.code)
        console.error("App error hint:", appsError.hint)
        console.error("App error details:", appsError.details)
        setPageError(`Failed to load applications: ${appsError.message || appsError.code}`)
        return
      }

      if (!appsRaw || appsRaw.length === 0) {
        setApplications([])
        return
      }

      // ── Step 2: Get unique property IDs ───────────────────────────────────
      const propertyIds = [
        ...new Set(appsRaw.map((a) => a.property_id).filter(Boolean)),
      ]

      // ── Step 2b: Fetch all viewing requests for tenant ─────────────────────
      const { data: viewingsRaw, error: viewingsError } = await supabase
        .from("viewing_requests")
        .select("id, property_id, requested_date, requested_time, status, tenant_message, landlord_message, created_at")
        .eq("tenant_id", profile.id)
        .order("created_at", { ascending: false })

      if (viewingsError) {
        console.error("Viewings error:", viewingsError.message)
      }

      // Combine property IDs from both applications and viewings
      const allPropertyIds = [
        ...new Set([
          ...propertyIds,
          ...(viewingsRaw?.map((v) => v.property_id) || []),
      ]
      // ── Step 3: Fetch properties ──────────────────────────────────────
      const { data: propertiesRaw, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          id, title, rent_amount, address, property_type, landlord_id,
          location_name, location_city, location_province, city, province
        `)
        .in("id", allPropertyIds)

      if (propertiesError) {
        console.error("Properties error:", propertiesError.message)
      }

      // ── Step 4: Fetch property images ─────────────────────────────────────
      const { data: imagesRaw, error: imagesError } = await supabase
        .from("property_images")
        .select("property_id, image_url, is_primary, display_order")
        .in("property_id", allPropertyIds)

      if (imagesError) {
        console.error("Images error:", imagesError.message)
      }

      // ── Step 5: Fetch landlord profiles ───────────────────────────────────
      const landlordIds = [
        ...new Set(
          (propertiesRaw ?? [])
            .map((p) => p.landlord_id)
            .filter(Boolean) as string[]
        ),
      ]

      let landlordMap: Record<string, { first_name: string; last_name: string }> = {}

      if (landlordIds.length > 0) {
        const { data: landlordsData, error: landlordsError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", landlordIds)

        if (landlordsError) {
          console.error("Landlords error:", landlordsError.message)
        }
        if (landlordsData) {
          landlordMap = Object.fromEntries(
            landlordsData.map((l) => [
              l.id,
              { first_name: l.first_name, last_name: l.last_name },
            ])
          )
        }
      }

      // ── Step 6: Build property map with images ────────────────────────────
      const propertyMap: Record<string, PropertyData> = {}
      for (const prop of propertiesRaw ?? []) {
        propertyMap[prop.id] = {
          ...prop,
          property_images: (imagesRaw ?? [])
            .filter((img) => img.property_id === prop.id)
            .map(({ image_url, is_primary, display_order }) => ({
              image_url,
              is_primary,
              display_order,
            })),
        }
      }

      // ── Step 7: Merge ─────────────────────────────────────────────────────
      const merged: Application[] = appsRaw.map((app) => {
        const property = propertyMap[app.property_id] ?? null
        return {
          id: app.id,
          status: app.status as ApplicationStatus,
          applied_at: app.applied_at,
          preferred_move_in_date: app.preferred_move_in_date ?? null,
          lease_duration_months: app.lease_duration_months ?? null,
          cover_letter: app.cover_letter ?? null,
          rejection_reason: app.rejection_reason ?? null,
          property_id: app.property_id,
          property,
          landlord: property?.landlord_id
            ? (landlordMap[property.landlord_id] ?? null)
            : null,
        }
      })

      setApplications(merged)

      // ── Step 8: Build viewing requests with property data ────────────────
      const viewingsMerged: ViewingRequest[] = (viewingsRaw ?? []).map((viewing) => {
        const property = propertyMap[viewing.property_id] ?? null
        return {
          id: viewing.id,
          property_id: viewing.property_id,
          requested_date: viewing.requested_date,
          requested_time: viewing.requested_time,
          status: viewing.status,
          tenant_message: viewing.tenant_message,
          landlord_message: viewing.landlord_message,
          created_at: viewing.created_at,
          property,
          landlord: property?.landlord_id
            ? (landlordMap[property.landlord_id] ?? null)
            : null,
        }
      })

      setViewingRequests(viewingsMerged)
    } catch (err) {
      console.error("Unexpected error:", err)
      setPageError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // ─── Real-time updates ────────────────────────────────────────────────────
  useRealtimeSubscription<ApplicationPayload>(
    "applications",
    (payload) => {
      if (payload.tenant_id === profile?.id) {
        console.log("📡 Application update received:", payload)
        fetchApplications()
      }
    },
    { event: "UPDATE", enabled: !!profile?.id }
  )

  useRealtimeSubscription(
    "viewing_requests",
    () => {
      if (profile?.id) {
        console.log("📡 Viewing requests update received")
        fetchApplications()
      }
    },
    { event: "*", enabled: !!profile?.id }
  )

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getLocationDisplay = (property: Application["property"]) => {
    if (!property) return "Unknown location"
    if (property.location_name) {
      return [property.location_name, property.location_city].filter(Boolean).join(", ")
    }
    return (
      [property.city, property.province].filter(Boolean).join(", ") || property.address
    )
  }

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":  return "bg-yellow-100 text-yellow-800"
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default:         return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":  return "Under Review"
      case "approved": return "Approved"
      case "rejected": return "Rejected"
      default:         return status
    }
  }

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3 w-3 mr-1 inline" />
      case "rejected": return <XCircle className="h-3 w-3 mr-1 inline" />
      default:         return <Clock className="h-3 w-3 mr-1 inline" />
    }
  }

  const getStatusBanner = (application: Application) => {
    switch (application.status) {
      case "approved":
        return (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-800">
              <strong>Congratulations!</strong> Your application has been approved.
              Please check your lease agreement to proceed.
            </p>
            <Link href="/tenant/leases" className="inline-block mt-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                View Lease Agreement
              </Button>
            </Link>
          </div>
        )
      case "rejected":
        return application.rejection_reason ? (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-800">
              <strong>Not Successful:</strong> {application.rejection_reason}
            </p>
          </div>
        ) : null
      default:
        return null
    }
  }

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filtered = applications.filter((app) => {
    const location = getLocationDisplay(app.property).toLowerCase()
    const matchesSearch =
      !searchTerm.trim() ||
      (app.property?.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.property?.address ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-24 w-24 bg-gray-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-600">
            {applications.length} application{applications.length !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <Link href="/tenant/properties">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse Properties
          </Button>
        </Link>
      </div>

      {/* Page error */}
      {pageError && (
        <Alert variant="destructive">
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by property name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        <span className="font-medium">{filtered.length}</span>{" "}
        application{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Application list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((application) => (
            <Card
              key={application.id}
              className="hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">

                  {/* Image */}
                  <div className="h-24 w-24 rounded-lg overflow-hidden shrink-0">
                    <PropertyImage
                      images={application.property?.property_images ?? []}
                      title={application.property?.title ?? "Property"}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">

                    {/* Title + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {application.property?.title ?? "Property Unavailable"}
                        </h3>
                        <p className="text-gray-600 flex items-center text-sm mt-0.5">
                          <MapPin className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">
                            {getLocationDisplay(application.property)}
                          </span>
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(application.status)} shrink-0 flex items-center`}
                      >
                        {getStatusIcon(application.status)}
                        {getStatusText(application.status)}
                      </Badge>
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm text-gray-600">
                      {application.property && (
                        <>
                          <span className="font-medium text-green-600">
                            R{application.property.rent_amount.toLocaleString()}/month
                          </span>
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {application.property.property_type}
                          </Badge>
                        </>
                      )}
                      {application.preferred_move_in_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Move-in:{" "}
                          {new Date(
                            application.preferred_move_in_date + "T00:00:00"
                          ).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {application.lease_duration_months && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {application.lease_duration_months} month lease
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-gray-500">
                        Applied{" "}
                        {new Date(application.applied_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {application.landlord && (
                          <span>
                            {" "}· Landlord: {application.landlord.first_name}{" "}
                            {application.landlord.last_name}
                          </span>
                        )}
                      </p>
                      <Link href={`/tenant/applications/${application.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>

                    {/* Status banner */}
                    {getStatusBanner(application)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You haven't applied for any properties yet"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link href="/tenant/properties">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}