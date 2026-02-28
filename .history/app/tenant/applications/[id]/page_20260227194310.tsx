"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationDetails {
  id: string
  status: "pending" | "viewing_requested" | "viewing_scheduled" | "viewing_declined" | "approved" | "rejected"
  applied_at: string
  proposed_move_in_date: string | null
  lease_duration_requested: number | null
  additional_occupants: number | null
  additional_occupants_details: string | null
  tenant_notes: string | null
  special_requests: string | null
  rejection_reason: string | null
  property: {
    id: string
    title: string
    address: string
    rent_amount: number
    deposit_amount: number
    property_type: string
    bedrooms: number
    bathrooms: number
    square_meters: number | null
    description: string | null
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
    landlord: {
      first_name: string
      last_name: string
      phone: string | null
      email: string | null
    } | null
  } | null
  viewing_request: {
    id: string
    requested_date: string
    requested_time: string
    status: string
    tenant_message: string | null
    landlord_message: string | null  // ✅ FIXED: was landlord_response
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
        <Building className="h-10 w-10 text-gray-400" />
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

export default function TenantApplicationDetailsPage() {
  const { profile } = useAuth()
  const params = useParams()
  const [application, setApplication] = useState<ApplicationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (params.id && profile?.id) {
      fetchApplicationDetails()
    }
  }, [params.id, profile?.id])

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true)
      setError("")

      // Step 1: Fetch application row
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at, proposed_move_in_date,
          lease_duration_requested, additional_occupants,
          additional_occupants_details, tenant_notes,
          special_requests, rejection_reason, property_id, tenant_id
        `)
        .eq("id", params.id)
        .eq("tenant_id", profile!.id)
        .single()

      if (applicationError) {
        setError(
          applicationError.code === "PGRST116"
            ? "Application not found or you don't have permission to view it"
            : "Failed to load application details"
        )
        return
      }

      if (!applicationData) {
        setError("Application not found")
        return
      }

      // Step 2: Fetch property with images in one query
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select(`
          id, title, address, rent_amount, deposit_amount,
          property_type, bedrooms, bathrooms, square_meters, description,
          landlord_id, location_name, location_city, location_province,
          city, province,
          property_images (
            image_url, is_primary, display_order
          )
        `)
        .eq("id", applicationData.property_id)
        .single()

      if (propertyError) {
        console.error("Property error:", propertyError)
        setError("Failed to load property details")
        return
      }

      // Step 3: Fetch landlord
      let landlordData = null
      if (propertyData?.landlord_id) {
        const { data: ld } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, email")
          .eq("id", propertyData.landlord_id)
          .maybeSingle()
        landlordData = ld
      }

      // Step 4: Fetch viewing request — ✅ FIXED column name + error handling
      const { data: vd, error: viewingError } = await supabase
        .from("viewing_requests")
        .select("id, requested_date, requested_time, status, tenant_message, landlord_message") // ✅ FIXED
        .eq("property_id", applicationData.property_id)
        .eq("tenant_id", profile!.id)
        .maybeSingle()

      // ✅ FIXED: Log all errors, always assign data
      if (viewingError) {
        console.error("Viewing error code:", viewingError.code)
        console.error("Viewing error message:", viewingError.message)
        console.error("Viewing error details:", viewingError.details)
      }
      const viewingData = vd ?? null // ✅ FIXED: always assign regardless of error

      // Sort images
      const sortedImages = [...(propertyData.property_images || [])].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return (a.display_order ?? 0) - (b.display_order ?? 0)
      })

      setApplication({
        id: applicationData.id,
        status: applicationData.status as ApplicationDetails["status"],
        applied_at: applicationData.applied_at,
        proposed_move_in_date: applicationData.proposed_move_in_date ?? null,
        lease_duration_requested: applicationData.lease_duration_requested ?? null,
        additional_occupants: applicationData.additional_occupants ?? null,
        additional_occupants_details: applicationData.additional_occupants_details ?? null,
        tenant_notes: applicationData.tenant_notes ?? null,
        special_requests: applicationData.special_requests ?? null,
        rejection_reason: applicationData.rejection_reason ?? null,
        property: {
          id: propertyData.id,
          title: propertyData.title,
          address: propertyData.address,
          rent_amount: propertyData.rent_amount,
          deposit_amount: propertyData.deposit_amount,
          property_type: propertyData.property_type,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          square_meters: propertyData.square_meters ?? null,
          description: propertyData.description ?? null,
          location_name: propertyData.location_name ?? null,
          location_city: propertyData.location_city ?? null,
          location_province: propertyData.location_province ?? null,
          city: propertyData.city ?? null,
          province: propertyData.province ?? null,
          property_images: sortedImages,
          landlord: landlordData ?? null,
        },
        viewing_request: viewingData,
      })
    } catch (err) {
      console.error("Error fetching application details:", err)
      setError("Failed to load application details")
    } finally {
      setLoading(false)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getLocationDisplay = () => {
    if (!application?.property) return ""
    const p = application.property
    if (p.location_name) {
      return [p.location_name, p.location_city, p.location_province].filter(Boolean).join(", ")
    }
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "viewing_requested": return "bg-blue-100 text-blue-800 border-blue-200"
      case "viewing_scheduled": return "bg-purple-100 text-purple-800 border-purple-200"
      case "viewing_declined": return "bg-orange-100 text-orange-800 border-orange-200"
      case "approved": return "bg-green-100 text-green-800 border-green-200"
      case "rejected": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "viewing_requested":
      case "viewing_scheduled": return <Calendar className="h-4 w-4" />
      case "viewing_declined": return <Eye className="h-4 w-4" />
      case "approved": return <CheckCircle className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-56 animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-32 w-32 bg-gray-200 rounded-lg shrink-0" />
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (error || !application) {
    return (
      <div className="space-y-6">
        <Link href="/tenant/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
            <p className="text-gray-600">
              {error || "The application you're looking for doesn't exist."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start space-x-4">
          <Link href="/tenant/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
            <p className="text-gray-600">
              {application.property?.title
                ? `Application for ${application.property.title}`
                : "Application Details"}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
          {getStatusIcon(application.status)}
          <span className="ml-1">{getStatusText(application.status)}</span>
        </Badge>
      </div>

      {/* Status Banners */}
      {application.status === "approved" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  Congratulations! Your application has been approved.
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  The landlord will contact you soon to proceed with the lease agreement
                  and arrange key collection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "rejected" && application.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Application Declined</h3>
                <p className="text-red-700 text-sm mt-1">
                  Reason: {application.rejection_reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "viewing_scheduled" && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900">Viewing Scheduled</h3>
                {application.viewing_request && (
                  <p className="text-purple-700 text-sm mt-1">
                    Your viewing is confirmed for{" "}
                    {new Date(application.viewing_request.requested_date).toLocaleDateString("en-ZA", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    at {application.viewing_request.requested_time}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "viewing_requested" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Viewing Requested</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Your viewing request has been sent. Waiting for the landlord to confirm.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.property ? (
                <>
                  <div className="flex gap-4">
                    <div className="h-32 w-32 rounded-lg overflow-hidden shrink-0">
                      <PropertyImage
                        images={application.property.property_images}
                        title={application.property.title}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold mb-1 truncate">
                        {application.property.title}
                      </h3>
                      <p className="text-gray-600 flex items-center text-sm mb-1">
                        <MapPin className="h-4 w-4 mr-1 shrink-0" />
                        <span className="truncate">{application.property.address}</span>
                      </p>
                      <p className="text-gray-600 text-sm mb-3">
                        {getLocationDisplay()}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {application.property.bedrooms} bed
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {application.property.bathrooms} bath
                        </div>
                        {application.property.square_meters && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            {application.property.square_meters}m²
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                      <p className="text-2xl font-bold text-green-600">
                        R{application.property.rent_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Security Deposit</p>
                      <p className="text-2xl font-bold">
                        R{(application.property.deposit_amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {application.property.description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-gray-700">Description</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {application.property.description}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="pt-1">
                    <Link href={`/tenant/properties/${application.property.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Property Listing
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm py-4 text-center">
                  Property details are no longer available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Landlord Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Landlord Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.property?.landlord ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {application.property.landlord.first_name}{" "}
                        {application.property.landlord.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Property Owner</p>
                    </div>
                  </div>
                  {application.property.landlord.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 shrink-0" />
                      {application.property.landlord.phone}
                    </div>
                  )}
                  {application.property.landlord.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{application.property.landlord.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Landlord information unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Applied On</p>
                <p className="font-medium text-sm">
                  {new Date(application.applied_at).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {application.proposed_move_in_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Proposed Move-in Date</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(application.proposed_move_in_date).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {application.lease_duration_requested && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Lease Duration</p>
                  <p className="font-medium text-sm">
                    {application.lease_duration_requested} months
                  </p>
                </div>
              )}

              {(application.additional_occupants ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Additional Occupants</p>
                  <p className="font-medium text-sm">
                    {application.additional_occupants} additional{" "}
                    {application.additional_occupants === 1 ? "person" : "people"}
                  </p>
                  {application.additional_occupants_details && (
                    <p className="text-xs text-gray-600 mt-1">
                      {application.additional_occupants_details}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Message */}
          {application.tenant_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {application.tenant_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Special Requests */}
          {application.special_requests && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Special Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {application.special_requests}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Viewing Request */}
          {application.viewing_request && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Viewing Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Requested Date & Time</p>
                  <p className="font-medium text-sm">
                    {new Date(application.viewing_request.requested_date).toLocaleDateString("en-ZA", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    at {application.viewing_request.requested_time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={getStatusColor(application.viewing_request.status)}>
                    {getStatusText(application.viewing_request.status)}
                  </Badge>
                </div>
                {application.viewing_request.tenant_message && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Message</p>
                    <p className="text-sm text-gray-700">
                      {application.viewing_request.tenant_message}
                    </p>
                  </div>
                )}
                {/* ✅ FIXED: was landlord_response, now landlord_message */}
                {application.viewing_request.landlord_message && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Landlord Response</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                      {application.viewing_request.landlord_message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}