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
import Image from "next/image"

interface ApplicationDetails {
  id: string
  status: "pending" | "viewing_requested" | "viewing_scheduled" | "viewing_declined" | "approved" | "rejected"
  applied_at: string
  proposed_move_in_date: string
  lease_duration_requested: number
  additional_occupants: number
  additional_occupants_details: string
  tenant_notes: string
  special_requests: string
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
    square_meters: number
    description: string
    property_images: Array<{
      image_url: string
      is_primary: boolean
    }>
    township: {
      name: string
      municipality: string
    }
    landlord: {
      first_name: string
      last_name: string
      phone: string
      email: string
    }
  }
  viewing_request?: {
    id: string
    requested_date: string
    requested_time: string
    status: string
    tenant_message: string
    landlord_response: string
  }
}

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

      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", params.id)
        .eq("tenant_id", profile?.id)
        .single()

      if (applicationError) {
        if (applicationError.code === "PGRST116") {
          setError("Application not found or you don't have permission to view it")
        } else {
          setError("Failed to load application details")
        }
        console.error("Application error:", applicationError)
        return
      }

      if (!applicationData) {
        setError("Application not found")
        return
      }

      // Fetch property data separately
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select(
          "id, title, address, rent_amount, deposit_amount, property_type, bedrooms, bathrooms, square_meters, description, landlord_id, township_id",
        )
        .eq("id", applicationData.property_id)
        .single()

      if (propertyError) {
        console.error("Property error:", propertyError)
        setError("Failed to load property details")
        return
      }

      // Fetch property images separately
      const { data: imagesData, error: imagesError } = await supabase
        .from("property_images")
        .select("image_url, is_primary")
        .eq("property_id", propertyData.id)

      if (imagesError) {
        console.error("Images error:", imagesError)
      }

      // Fetch township data separately
      const { data: townshipData, error: townshipError } = await supabase
        .from("townships")
        .select("name, municipality")
        .eq("id", propertyData.township_id)
        .single()

      if (townshipError) {
        console.error("Township error:", townshipError)
      }

      // Fetch landlord data separately
      const { data: landlordData, error: landlordError } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, email")
        .eq("id", propertyData.landlord_id)
        .single()

      if (landlordError) {
        console.error("Landlord error:", landlordError)
      }

      // Fetch viewing request separately if exists
      const { data: viewingData, error: viewingError } = await supabase
        .from("viewing_requests")
        .select("*")
        .eq("property_id", propertyData.id)
        .eq("tenant_id", profile?.id)
        .single()

      if (viewingError && viewingError.code !== "PGRST116") {
        console.warn("Viewing request not found:", viewingError)
      }

      // Combine all data
      const combinedApplication = {
        ...applicationData,
        property: {
          ...propertyData,
          property_images: imagesData || [],
          township: townshipData || { name: "Unknown", municipality: "Unknown" },
          landlord: landlordData || { first_name: "Unknown", last_name: "Landlord", phone: "", email: "" },
        },
        viewing_request: viewingData || null,
      }

      setApplication(combinedApplication)
    } catch (error) {
      console.error("Error fetching application details:", error)
      setError("Failed to load application details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "viewing_requested":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "viewing_scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "viewing_declined":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "viewing_requested":
        return <Calendar className="h-4 w-4" />
      case "viewing_scheduled":
        return <Calendar className="h-4 w-4" />
      case "viewing_declined":
        return <Eye className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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
        return "Ready for Approval"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/tenant/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
            <p className="text-gray-600">{error || "The application you're looking for doesn't exist."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const primaryImage = application.property.property_images?.find((img) => img.is_primary)?.image_url

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tenant/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
            <p className="text-gray-600">Application for {application.property.title}</p>
          </div>
        </div>
        <Badge className={getStatusColor(application.status)}>
          {getStatusIcon(application.status)}
          <span className="ml-1">{getStatusText(application.status)}</span>
        </Badge>
      </div>

      {/* Status Messages */}
      {application.status === "approved" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Congratulations! Your application has been approved.</h3>
                <p className="text-green-700">
                  The landlord will contact you soon to proceed with the lease agreement and arrange key collection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "rejected" && application.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Application Declined</h3>
                <p className="text-red-700">Reason: {application.rejection_reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="relative h-32 w-32 rounded-lg overflow-hidden flex-shrink-0">
                  {primaryImage ? (
                    <Image
                      src={primaryImage || "/placeholder.svg"}
                      alt={application.property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{application.property.title}</h3>
                  <p className="text-gray-600 flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {application.property.address}
                  </p>
                  <p className="text-gray-600 mb-2">
                    {application.property.township.name}, {application.property.township.municipality}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {application.property.bedrooms} bed
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {application.property.bathrooms} bath
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {application.property.square_meters}m²
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="text-2xl font-bold">R{application.property.rent_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Security Deposit</p>
                  <p className="text-2xl font-bold">R{application.property.deposit_amount.toLocaleString()}</p>
                </div>
              </div>

              {application.property.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700">{application.property.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Landlord Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Landlord Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {application.property.landlord.first_name} {application.property.landlord.last_name}
                  </p>
                </div>
                {application.property.landlord.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {application.property.landlord.phone}
                  </div>
                )}
                {application.property.landlord.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {application.property.landlord.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Applied On</p>
                <p className="font-medium">{new Date(application.applied_at).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Proposed Move-in Date</p>
                <p className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(application.proposed_move_in_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Lease Duration</p>
                <p className="font-medium">{application.lease_duration_requested} months</p>
              </div>

              {application.additional_occupants > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Additional Occupants</p>
                  <p className="font-medium">{application.additional_occupants} additional people</p>
                  {application.additional_occupants_details && (
                    <p className="text-sm text-gray-600 mt-1">{application.additional_occupants_details}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {application.tenant_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Your Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{application.tenant_notes}</p>
              </CardContent>
            </Card>
          )}

          {application.special_requests && (
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{application.special_requests}</p>
              </CardContent>
            </Card>
          )}

          {application.viewing_request && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Viewing Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Requested Date & Time</p>
                  <p className="font-medium">
                    {new Date(application.viewing_request.requested_date).toLocaleDateString()} at{" "}
                    {application.viewing_request.requested_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(application.viewing_request.status)}>
                    {application.viewing_request.status}
                  </Badge>
                </div>
                {application.viewing_request.tenant_message && (
                  <div>
                    <p className="text-sm text-gray-600">Your Message</p>
                    <p className="text-sm">{application.viewing_request.tenant_message}</p>
                  </div>
                )}
                {application.viewing_request.landlord_response && (
                  <div>
                    <p className="text-sm text-gray-600">Landlord Response</p>
                    <p className="text-sm">{application.viewing_request.landlord_response}</p>
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
