"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Application {
  id: string
  status: "pending" | "viewing_requested" | "viewing_scheduled" | "viewing_declined" | "approved" | "rejected"
  applied_at: string
  proposed_move_in_date: string | null
  lease_duration_requested: number | null
  tenant_notes: string | null
  rejection_reason: string | null
  property_id: string
  property: {
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
  } | null
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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (profile?.id) {
      fetchApplications()
    }
  }, [profile?.id])

  const fetchApplications = async () => {
    try {
      // Step 1: Fetch applications with property + images joined
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at, proposed_move_in_date,
          lease_duration_requested, tenant_notes, rejection_reason, property_id,
          property:properties (
            id, title, rent_amount, address, property_type, landlord_id,
            location_name, location_city, location_province, city, province,
            property_images (
              image_url, is_primary, display_order
            )
          )
        `)
        .eq("tenant_id", profile!.id)
        .order("applied_at", { ascending: false })

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError)
        return
      }

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([])
        return
      }

      // Step 2: Batch fetch landlord profiles
      const landlordIds = [
        ...new Set(
          applicationsData
            .map((app) => {
              const prop = Array.isArray(app.property) ? app.property[0] : app.property
              return prop?.landlord_id
            })
            .filter(Boolean) as string[]
        ),
      ]

      let landlordMap: Record<string, { first_name: string; last_name: string }> = {}

      if (landlordIds.length > 0) {
        const { data: landlordsData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", landlordIds)

        if (landlordsData) {
          landlordMap = Object.fromEntries(
            landlordsData.map((l) => [l.id, { first_name: l.first_name, last_name: l.last_name }])
          )
        }
      }

      // Step 3: Merge into flat shape
      const merged: Application[] = applicationsData.map((app) => {
        const prop = Array.isArray(app.property) ? app.property[0] : app.property
        return {
          id: app.id,
          status: app.status as Application["status"],
          applied_at: app.applied_at,
          proposed_move_in_date: app.proposed_move_in_date ?? null,
          lease_duration_requested: app.lease_duration_requested ?? null,
          tenant_notes: app.tenant_notes ?? null,
          rejection_reason: app.rejection_reason ?? null,
          property_id: app.property_id,
          property: prop ?? null,
          landlord: prop?.landlord_id ? (landlordMap[prop.landlord_id] ?? null) : null,
        }
      })

      setApplications(merged)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getLocationDisplay = (property: Application["property"]) => {
    if (!property) return "Unknown location"
    if (property.location_name) {
      return [property.location_name, property.location_city].filter(Boolean).join(", ")
    }
    return [property.city, property.province].filter(Boolean).join(", ") || property.address
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "viewing_requested": return "bg-blue-100 text-blue-800"
      case "viewing_scheduled": return "bg-purple-100 text-purple-800"
      case "viewing_declined": return "bg-orange-100 text-orange-800"
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Under Review"
      case "viewing_requested": return "Viewing Requested"
      case "viewing_scheduled": return "Viewing Scheduled"
      case "viewing_declined": return "Ready for Approval"
      case "approved": return "Approved"
      case "rejected": return "Rejected"
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3 w-3 mr-1 inline" />
      case "rejected": return <XCircle className="h-3 w-3 mr-1 inline" />
      default: return <Clock className="h-3 w-3 mr-1 inline" />
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "room": return "Room"
      case "bachelor": return "Bachelor"
      case "cottage": return "Cottage"
      default: return type
    }
  }

  // ─── Filtering ───────────────────────────────────────────────────────────────

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

  // ─── Loading ─────────────────────────────────────────────────────────────────

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

  // ─── Render ──────────────────────────────────────────────────────────────────

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by property name, location..."
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
                <SelectItem value="viewing_requested">Viewing Requested</SelectItem>
                <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                <SelectItem value="viewing_declined">Ready for Approval</SelectItem>
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

      {/* List */}
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
                          <span className="truncate">{getLocationDisplay(application.property)}</span>
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(application.status)} shrink-0 flex items-center`}>
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
                          <Badge variant="outline" className="text-xs font-normal">
                            {getPropertyTypeLabel(application.property.property_type)}
                          </Badge>
                        </>
                      )}
                      {application.proposed_move_in_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Move-in:{" "}
                          {new Date(application.proposed_move_in_date).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {application.lease_duration_requested && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {application.lease_duration_requested} month lease
                        </span>
                      )}
                    </div>

                    {/* Footer row */}
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

                    {/* Status banners */}
                    {application.status === "rejected" && application.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {application.status === "approved" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-sm text-green-800">
                          <strong>Congratulations!</strong> Your application has been approved.
                          The landlord will contact you soon to proceed with the lease agreement.
                        </p>
                      </div>
                    )}

                    {application.status === "viewing_scheduled" && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-sm text-purple-800">
                          <strong>Viewing Scheduled</strong> — Check your application details for
                          the confirmed date and time.
                        </p>
                      </div>
                    )}

                    {application.status === "viewing_requested" && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800">
                          <strong>Viewing Requested</strong> — Waiting for the landlord to confirm
                          your viewing appointment.
                        </p>
                      </div>
                    )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
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