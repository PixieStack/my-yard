"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Plus, Search, MapPin, Bed, Bath, Coins, Eye, Edit } from "lucide-react"
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
  address: string
  // ✅ New location columns (no longer using townships join)
  location_name: string | null
  location_city: string | null
  location_province: string | null
  // ✅ Legacy columns (keep for backward compat)
  city: string | null
  province: string | null
  status: "available" | "occupied" | "maintenance"
  is_furnished: boolean
  is_active: boolean
  created_at: string
  property_images: Array<{
    image_url: string
    is_primary: boolean
  }>
}

export default function PropertiesPage() {
  const { profile } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchProperties()
    }
  }, [profile?.id])

  const fetchProperties = async () => {
    setFetchError(null)
    try {
      console.log("🔍 Fetching properties for landlord:", profile?.id)

      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          title,
          description,
          property_type,
          rent_amount,
          deposit_amount,
          bedrooms,
          bathrooms,
          address,
          location_name,
          location_city,
          location_province,
          city,
          province,
          status,
          is_furnished,
          is_active,
          created_at,
          property_images (
            image_url,
            is_primary
          )
        `)
        .eq("landlord_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching properties:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        setFetchError(error.message)
        return
      }

      console.log("✅ Properties fetched:", data?.length ?? 0)
      setProperties(data || [])
    } catch (err: any) {
      console.error("❌ Unexpected error fetching properties:", err)
      setFetchError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // ── Helper: get display location from either new or legacy columns ──
  const getLocationDisplay = (property: Property): string => {
    // Prefer new location columns
    if (property.location_name) {
      const parts = [property.location_name, property.location_city].filter(Boolean)
      return parts.join(", ")
    }
    // Fall back to legacy city/province
    if (property.city) {
      return [property.city, property.province].filter(Boolean).join(", ")
    }
    // Fall back to address
    return property.address || "Location not set"
  }

  const togglePropertyStatus = async (
    propertyId: string,
    currentStatus: string,
    currentIsActive: boolean
  ) => {
    try {
      let newStatus: "available" | "occupied" | "maintenance"
      let newIsActive: boolean

      if (currentStatus === "available") {
        newStatus = "maintenance"
        newIsActive = false
      } else if (currentStatus === "maintenance") {
        newStatus = "available"
        newIsActive = true
      } else {
        newStatus = "available"
        newIsActive = true
      }

      const { error } = await supabase
        .from("properties")
        .update({ status: newStatus, is_active: newIsActive })
        .eq("id", propertyId)

      if (error) throw error

      setProperties((prev) =>
        prev.map((prop) =>
          prop.id === propertyId
            ? { ...prop, status: newStatus, is_active: newIsActive }
            : prop
        )
      )
    } catch (error) {
      console.error("Error updating property status:", error)
    }
  }

  const filteredProperties = properties.filter((property) => {
    const location = getLocationDisplay(property).toLowerCase()
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || property.status === statusFilter
    const matchesType = typeFilter === "all" || property.property_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive && status !== "occupied") return "bg-gray-100 text-gray-600"
    switch (status) {
      case "available": return "bg-green-100 text-green-800"
      case "occupied": return "bg-blue-100 text-blue-800"
      case "maintenance": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string, isActive: boolean) => {
    if (!isActive && status === "occupied") return "Occupied"
    if (!isActive) return "Deactivated"
    switch (status) {
      case "available": return "Available"
      case "occupied": return "Occupied"
      case "maintenance": return "Maintenance"
      default: return status
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

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-700 text-sm font-medium">
              ❌ Failed to load properties: {fetchError}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchProperties}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
                <SelectItem value="cottage">Cottage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const primaryImage =
              property.property_images?.find((img) => img.is_primary)?.image_url ||
              property.property_images?.[0]?.image_url

            return (
              <Card
                key={property.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  !property.is_active && property.status !== "occupied"
                    ? "opacity-75"
                    : ""
                }`}
              >
                {/* Image */}
                <div className="relative h-48">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={property.title}
                      fill
                      className="object-cover"
                      unoptimized={primaryImage.startsWith("data:")} // base64 images
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={getStatusColor(property.status, property.is_active)}
                    >
                      {getStatusText(property.status, property.is_active)}
                    </Badge>
                  </div>
                  {!property.is_active && property.status !== "occupied" && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-white text-gray-800">
                        Not Available
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Card Header */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {property.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        <span className="line-clamp-1">
                          {getLocationDisplay(property)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Card Content */}
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">
                        {getPropertyTypeLabel(property.property_type)}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms}
                      </div>
                      {property.is_furnished && (
                        <Badge variant="secondary" className="text-xs">
                          Furnished
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-lg font-semibold text-green-600">
                          <Coins className="h-4 w-4 mr-1" />
                          R{property.rent_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per month</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link
                        href={`/landlord/properties/${property.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/landlord/properties/${property.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          togglePropertyStatus(
                            property.id,
                            property.status,
                            property.is_active
                          )
                        }
                        className={
                          property.status === "occupied"
                            ? "text-green-600"
                            : property.status === "maintenance" || !property.is_active
                            ? "text-green-600"
                            : "text-orange-600"
                        }
                        disabled={property.status === "occupied"}
                      >
                        {property.status === "available"
                          ? "Maintenance"
                          : property.status === "maintenance"
                          ? "Activate"
                          : property.status === "occupied"
                          ? "Occupied"
                          : "Activate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first property"}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Link href="/landlord/properties/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}