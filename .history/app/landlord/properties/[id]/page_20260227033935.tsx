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
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

interface Property {
  id: string
  title: string
  description: string
  property_type: "room" | "bachelor" | "cottage"
  rent_amount: number
  deposit_amount: number
  bedrooms: number
  bathrooms: number
  square_meters: number
  address: string
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
  available_from: string
  lease_duration_months: number
  minimum_lease_months: number
  is_active: boolean
  views_count: number
  favorites_count: number
  applications_count: number
  created_at: string
  township: {
    name: string
    municipality: string
  }
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
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProperty()
      fetchApplications()
    }
  }, [id])

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          township:townships(name, municipality),
          property_images(id, image_url, is_primary, display_order),
          property_amenities(amenity_name, amenity_category)
        `)
        .eq("id", id)
        .eq("landlord_id", profile?.id)
        .single()

      if (error) {
        console.error("Error fetching property:", error)
        router.push("/landlord/properties")
        return
      }

      // Sort images by display order
      if (data.property_images) {
        data.property_images.sort((a, b) => a.display_order - b.display_order)
      }

      setProperty(data)
    } catch (error) {
      console.error("Error fetching property:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at,
          tenant:tenant_profiles(
            profiles(first_name, last_name, email)
          )
        `)
        .eq("property_id", id)
        .order("applied_at", { ascending: false })

      setApplications(
        (data || []).map((app: any) => ({
          ...app,
          tenant: app.tenant?.profiles?.[0]
            ? {
                first_name: app.tenant.profiles[0].first_name,
                last_name: app.tenant.profiles[0].last_name,
                email: app.tenant.profiles[0].email,
              }
            : { first_name: "", last_name: "", email: "" },
        }))
      )
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const togglePropertyStatus = async () => {
    if (!property) return

    try {
      let newStatus: "available" | "occupied" | "maintenance"
      let newIsActive: boolean

      // Determine new status based on current state
      if (property.status === "available") {
        // If available, allow switching to maintenance or deactivating
        newStatus = "maintenance"
        newIsActive = property.is_active
      } else if (property.status === "maintenance") {
        // If in maintenance, switch back to available
        newStatus = "available"
        newIsActive = true
      } else {
        // If occupied, only allow deactivation
        newStatus = property.status
        newIsActive = false
      }

      const { error } = await supabase
        .from("properties")
        .update({
          status: newStatus,
          is_active: newIsActive,
        })
        .eq("id", property.id)

      if (error) throw error

      setProperty({ ...property, status: newStatus, is_active: newIsActive })
    } catch (error) {
      console.error("Error updating property status:", error)
    }
  }

  const changePropertyStatus = async (newStatus: "available" | "occupied" | "maintenance") => {
    if (!property) return

    try {
      const updateData: any = { status: newStatus }

      // Auto-activate property when setting to available
      if (newStatus === "available") {
        updateData.is_active = true
      }
      // Auto-deactivate when setting to occupied (property is no longer available for rent)
      else if (newStatus === "occupied") {
        updateData.is_active = false
      }

      const { error } = await supabase.from("properties").update(updateData).eq("id", property.id)

      if (error) throw error

      setProperty({ ...property, ...updateData })
    } catch (error) {
      console.error("Error updating property status:", error)
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {property.township.name}, {property.township.municipality}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
          <Badge variant={property.is_active ? "default" : "secondary"}>
            {property.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link href={`/landlord/properties/${property.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </Button>
        </Link>

        {property.status === "available" && (
          <>
            <Button variant="outline" onClick={() => changePropertyStatus("maintenance")}>
              Set to Maintenance
            </Button>
            <Button variant="outline" onClick={() => setProperty({ ...property, is_active: !property.is_active })}>
              {property.is_active ? (
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
          <Button variant="outline" onClick={() => changePropertyStatus("available")}>
            <Eye className="mr-2 h-4 w-4" />
            Mark as Available
          </Button>
        )}

        {property.status === "occupied" && (
          <Button variant="outline" onClick={() => changePropertyStatus("available")}>
            <Eye className="mr-2 h-4 w-4" />
            Mark as Available Again
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Images and Basic Info */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Images */}
            <div className="space-y-4">
              {property.property_images.length > 0 ? (
                <>
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={property.property_images[activeImageIndex]?.image_url || "/placeholder.svg"}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {property.property_images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {property.property_images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-16 rounded overflow-hidden border-2 ${
                            index === activeImageIndex ? "border-blue-500" : "border-gray-200"
                          }`}
                        >
                          <Image src={image.image_url || "/placeholder.svg"} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Property Details</span>
                    <Badge variant="outline">{getPropertyTypeLabel(property.property_type)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{property.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bath className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{property.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{property.parking_spaces} Parking</span>
                    </div>
                    {property.square_meters && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{property.square_meters}m²</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-green-600">
                        R{property.rent_amount.toLocaleString()}/month
                      </span>
                    </div>
                    {property.deposit_amount && (
                      <p className="text-sm text-gray-600">Deposit: R{property.deposit_amount.toLocaleString()}</p>
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
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span>Furnished</span>
                      </div>
                    )}
                    {property.pets_allowed && (
                      <div className="flex items-center space-x-2 text-sm">
                        <PawPrint className="h-4 w-4 text-gray-500" />
                        <span>Pets Allowed</span>
                      </div>
                    )}
                    {property.smoking_allowed && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Cigarette className="h-4 w-4 text-gray-500" />
                        <span>Smoking Allowed</span>
                      </div>
                    )}
                    {property.garden_access && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Trees className="h-4 w-4 text-gray-500" />
                        <span>Garden Access</span>
                      </div>
                    )}
                    {property.wifi_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Wifi className="h-4 w-4 text-gray-500" />
                        <span>WiFi Included</span>
                      </div>
                    )}
                    {property.electricity_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Zap className="h-4 w-4 text-gray-500" />
                        <span>Electricity Included</span>
                      </div>
                    )}
                    {property.water_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Droplets className="h-4 w-4 text-gray-500" />
                        <span>Water Included</span>
                      </div>
                    )}
                    {property.gas_included && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Flame className="h-4 w-4 text-gray-500" />
                        <span>Gas Included</span>
                      </div>
                    )}
                  </div>

                  {property.property_amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Additional Amenities</h4>
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
                <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
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
                <div>
                  <p className="text-sm text-gray-600">Preferred Lease Duration</p>
                  <p className="font-medium">{property.lease_duration_months} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum Lease Duration</p>
                  <p className="font-medium">{property.minimum_lease_months} months</p>
                </div>
                {property.available_from && (
                  <div>
                    <p className="text-sm text-gray-600">Available From</p>
                    <p className="font-medium">{new Date(property.available_from).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {application.tenant.first_name} {application.tenant.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{application.tenant.email}</p>
                        <p className="text-xs text-gray-500">
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getApplicationStatusColor(application.status)}>{application.status}</Badge>
                        <Link href={`/landlord/applications/${application.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600">Applications will appear here when tenants apply for this property.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.views_count}</div>
                <p className="text-xs text-muted-foreground">Property page views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.favorites_count}</div>
                <p className="text-xs text-muted-foreground">Times favorited</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{property.applications_count}</div>
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
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Application Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {property.views_count > 0
                        ? ((property.applications_count / property.views_count) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {property.applications_count} applications from {property.views_count} views
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Interest Level</span>
                    <span className="text-sm text-muted-foreground">
                      {property.views_count > 0
                        ? ((property.favorites_count / property.views_count) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {property.favorites_count} favorites from {property.views_count} views
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
