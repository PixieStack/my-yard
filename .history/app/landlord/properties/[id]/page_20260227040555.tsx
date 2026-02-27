"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Car,
  Wifi,
  Zap,
  Droplets,
  Flame,
  Trees,
  PawPrint,
  Cigarette,
  Edit,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  FileText,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string
  title: string
  description: string
  property_type: "room" | "bachelor" | "cottage"
  rent_amount: number
  deposit_amount: number
  bedrooms: number
  bathrooms: number
  square_meters: number | null
  address: string
  location_name: string | null
  location_city: string | null
  location_province: string | null
  city: string | null
  province: string | null
  status: "available" | "occupied" | "maintenance"
  is_furnished: boolean
  pets_allowed: boolean
  smoking_allowed: boolean
  parking_spaces: number
  garden_access: boolean
  wifi_included: boolean
  electricity_included: boolean
  water_included: boolean
  gas_included: boolean
  available_from: string | null
  lease_duration_months: number
  minimum_lease_months: number
  is_active: boolean
  views_count: number
  favorites_count: number
  applications_count: number
  created_at: string
  property_images: Array<{
    id: string
    image_url: string
    is_primary: boolean
    display_order: number
  }>
  property_amenities: Array<{
    amenity_name: string
    amenity_category: string
  }>
}

interface Application {
  id: string
  status: "pending" | "approved" | "rejected"
  applied_at: string
  tenant_id: string
  tenant: {
    first_name: string
    last_name: string
    email: string
  } | null
}

// ─── PropertyImage component ──────────────────────────────────────────────────

function PropertyImage({
  images,
  title,
  className = "",
}: {
  images: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>
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
        <Building className="h-12 w-12 text-gray-400" />
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

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const router = useRouter()

  const [property, setProperty] = useState<Property | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [activationUpdating, setActivationUpdating] = useState(false)

  // Wait for both id and profile before fetching
  useEffect(() => {
    if (id && profile?.id) {
      fetchProperty()
      fetchApplications()
    }
  }, [id, profile?.id])

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, property_type,
          rent_amount, deposit_amount, bedrooms, bathrooms, square_meters,
          address, location_name, location_city, location_province,
          city, province, status, is_furnished, pets_allowed, smoking_allowed,
          parking_spaces, garden_access, wifi_included, electricity_included,
          water_included, gas_included, available_from,
          lease_duration_months, minimum_lease_months,
          is_active, views_count, favorites_count, applications_count, created_at,
          property_images (id, image_url, is_primary, display_order),
          property_amenities (amenity_name, amenity_category)
        `)
        .eq("id", id)
        .eq("landlord_id", profile!.id)
        .single()

      if (error) {
        console.error("Error fetching property:", error)
        router.push("/landlord/properties")
        return
      }

      // Sort images by display_order, primary first
      if (data.property_images) {
        data.property_images.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return (a.display_order ?? 0) - (b.display_order ?? 0)
        })
      }

      setProperty(data as Property)
    } catch (error) {
      console.error("Error fetching property:", error)
      router.push("/landlord/properties")
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      // Query applications with tenant profile joined directly from profiles table
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at, tenant_id
        `)
        .eq("property_id", id)
        .order("applied_at", { ascending: false })

      if (error) {
        console.error("Error fetching applications:", error)
        return
      }

      if (!data || data.length === 0) {
        setApplications([])
        return
      }

      // Fetch tenant profiles in one batch query
      const tenantIds = data.map((a) => a.tenant_id).filter(Boolean)

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", tenantIds)

      const profileMap: Record<string, { first_name: string; last_name: string; email: string }> = {}
      profiles?.forEach((p) => {
        profileMap[p.id] = {
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
        }
      })

      const merged: Application[] = data.map((app) => ({
        id: app.id,
        status: app.status as Application["status"],
        applied_at: app.applied_at,
        tenant_id: app.tenant_id,
        tenant: profileMap[app.tenant_id] ?? null,
      }))

      setApplications(merged)
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  // ─── Status management ─────────────────────────────────────────────────────

  const changePropertyStatus = async (
    newStatus: "available" | "occupied" | "maintenance"
  ) => {
    if (!property || statusUpdating) return
    setStatusUpdating(true)

    try {
      const updateData: {
        status: "available" | "occupied" | "maintenance"
        is_active?: boolean
      } = { status: newStatus }

      if (newStatus === "available") {
        updateData.is_active = true
      } else if (newStatus === "occupied") {
        updateData.is_active = false
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", property.id)

      if (error) throw error

      setProperty({ ...property, ...updateData })
    } catch (error) {
      console.error("Error updating property status:", error)
    } finally {
      setStatusUpdating(false)
    }
  }

  const toggleActivation = async () => {
    if (!property || activationUpdating) return
    setActivationUpdating(true)

    try {
      const newIsActive = !property.is_active

      const { error } = await supabase
        .from("properties")
        .update({ is_active: newIsActive })
        .eq("id", property.id)

      if (error) throw error

      setProperty({ ...property, is_active: newIsActive })
    } catch (error) {
      console.error("Error toggling activation:", error)
    } finally {
      setActivationUpdating(false)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getLocationDisplay = (p: Property) => {
    if (p.location_name) {
      return [p.location_name, p.location_city, p.location_province]
        .filter(Boolean)
        .join(", ")
    }
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Property not found</h3>
        <Link href="/landlord/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start space-x-4">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
            <p className="text-gray-600 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 shrink-0" />
              {getLocationDisplay(property)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(property.status)}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>
          <Badge variant={property.is_active ? "default" : "secondary"}>
            {property.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/landlord/properties/${property.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </Button>
        </Link>

        {property.status === "available" && (
          <>
            <Button
              variant="outline"
              onClick={() => changePropertyStatus("maintenance")}
              disabled={statusUpdating}
            >
              {statusUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Set to Maintenance
            </Button>
            <Button
              variant="outline"
              onClick={toggleActivation}
              disabled={activationUpdating}
            >
              {activationUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : property.is_active ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Deactivate Listing
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Activate Listing
                </>
              )}
            </Button>
          </>
        )}

        {property.status === "maintenance" && (
          <Button
            variant="outline"
            onClick={() => changePropertyStatus("available")}
            disabled={statusUpdating}
          >
            {statusUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Mark as Available
          </Button>
        )}

        {property.status === "occupied" && (
          <Button
            variant="outline"
            onClick={() => changePropertyStatus("available")}
            disabled={statusUpdating}
          >
            {statusUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Mark as Available Again
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">

            {/* Images */}
            <div className="space-y-3">
              {property.property_images.length > 0 ? (
                <>
                  <div className="relative h-64 rounded-lg overflow-hidden bg-gray-100">
                    <PropertyImage
                      images={[property.property_images[activeImageIndex]]}
                      title={property.title}
                      className="w-full h-full"
                    />
                  </div>
                  {property.property_images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {property.property_images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-14 rounded overflow-hidden border-2 transition-all ${
                            index === activeImageIndex
                              ? "border-blue-500 opacity-100"
                              : "border-gray-200 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={image.image_url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images uploaded</p>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Property Details</span>
                    <Badge variant="outline">
                      {getPropertyTypeLabel(property.property_type)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="text-sm">{property.bedrooms} Bedroom{property.bedrooms !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bath className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="text-sm">{property.bathrooms} Bathroom{property.bathrooms !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="text-sm">{property.parking_spaces} Parking</span>
                    </div>
                    {property.square_meters && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500 shrink-0" />
                        <span className="text-sm">{property.square_meters}m²</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <span className="text-lg font-semibold text-green-600">
                      R{property.rent_amount.toLocaleString()}/month
                    </span>
                    {property.deposit_amount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Deposit: R{property.deposit_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {property.is_furnished && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="h-2 w-2 bg-green-500 rounded-full shrink-0" />
                        <span>Furnished</span>
                      </div>
                    )}
                    {property.pets_allowed && (
                      <div className="flex items-center space-x-2 text-sm">
                        <PawPrint className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Pets Allowed</span>
                      </div>
                    )}
                    {property.smoking_allowed && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Cigarette className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Smoking Allowed</span>
                      </div>
                    )}
                    {property.garden_access && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Trees className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Garden Access</span>
                      </div>
                    )}
                    {property.wifi_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Wifi className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>WiFi Included</span>
                      </div>
                    )}
                    {property.electricity_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Zap className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Electricity Included</span>
                      </div>
                    )}
                    {property.water_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Droplets className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Water Included</span>
                      </div>
                    )}
                    {property.gas_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Flame className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>Gas Included</span>
                      </div>
                    )}
                  </div>

                  {property.property_amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-sm">Additional Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.property_amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary">
                            {amenity.amenity_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lease Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Lease Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Preferred Lease Duration</p>
                  <p className="font-medium">{property.lease_duration_months} months</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Minimum Lease Duration</p>
                  <p className="font-medium">{property.minimum_lease_months} months</p>
                </div>
                {property.available_from && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Available From</p>
                    <p className="font-medium">
                      {new Date(property.available_from).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Applications Tab ──────────────────────────────────────────────── */}
        <TabsContent value="applications" className="space-y-4">
          {applications.length > 0 ? (
            applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="min-w-0">
                      <h4 className="font-medium">
                        {application.tenant
                          ? `${application.tenant.first_name} ${application.tenant.last_name}`
                          : "Tenant info unavailable"}
                      </h4>
                      {application.tenant?.email && (
                        <p className="text-sm text-gray-600">{application.tenant.email}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Applied{" "}
                        {new Date(application.applied_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <Badge className={getApplicationStatusColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                      <Link href={`/landlord/applications/${application.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600">
                  Applications will appear here when tenants apply for this property.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Analytics Tab ────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.views_count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Property page views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favourites</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.favorites_count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Times favourited</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.applications_count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Total applications</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>How your property is performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Application Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {(property.views_count ?? 0) > 0
                        ? (((property.applications_count ?? 0) / property.views_count) * 100).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (property.views_count ?? 0) > 0
                            ? Math.min(
                                (((property.applications_count ?? 0) / property.views_count) * 100),
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {property.applications_count ?? 0} applications from {property.views_count ?? 0} views
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Interest Level</span>
                    <span className="text-sm text-muted-foreground">
                      {(property.views_count ?? 0) > 0
                        ? (((property.favorites_count ?? 0) / property.views_count) * 100).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (property.views_count ?? 0) > 0
                            ? Math.min(
                                (((property.favorites_count ?? 0) / property.views_count) * 100),
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {property.favorites_count ?? 0} favourites from {property.views_count ?? 0} views
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}