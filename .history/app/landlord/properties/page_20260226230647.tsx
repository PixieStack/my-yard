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
  status: "available" | "occupied" | "maintenance"
  is_furnished: boolean
  is_active: boolean
  created_at: string
  township: {
    name: string
    municipality: string
  }
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

  useEffect(() => {
    if (profile?.id) {
      fetchProperties()
    }
  }, [profile?.id])

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          township:townships(name, municipality),
          property_images(image_url, is_primary)
        `)
        .eq("landlord_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching properties:", error)
        return
      }

      setProperties(data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePropertyStatus = async (propertyId: string, currentStatus: string, currentIsActive: boolean) => {
    try {
      let newStatus: "available" | "occupied" | "maintenance"
      let newIsActive: boolean

      if (currentStatus === "available") {
        newStatus = "maintenance"
        newIsActive = false // Set to false when in maintenance
      } else if (currentStatus === "maintenance") {
        newStatus = "available"
        newIsActive = true
      } else {
        // If occupied, mark as available again
        newStatus = "available"
        newIsActive = true
      }

      const { error } = await supabase
        .from("properties")
        .update({
          status: newStatus,
          is_active: newIsActive,
        })
        .eq("id", propertyId)

      if (error) throw error

      // Update local state
      setProperties((prev) =>
        prev.map((prop) => (prop.id === propertyId ? { ...prop, status: newStatus, is_active: newIsActive } : prop)),
      )
    } catch (error) {
      console.error("Error updating property status:", error)
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.township?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || property.status === statusFilter
    const matchesType = typeFilter === "all" || property.property_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive && status !== "occupied") {
      return "bg-gray-100 text-gray-600" // Deactivated properties
    }

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

  const getStatusText = (status: string, isActive: boolean) => {
    if (!isActive && status === "occupied") {
      return "Occupied"
    }
    if (!isActive) {
      return "Deactivated"
    }

    switch (status) {
      case "available":
        return "Available"
      case "occupied":
        return "Occupied"
      case "maintenance":
        return "Maintenance"
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
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
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
                <SelectValue placeholder="Status" />
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
                <SelectValue placeholder="Type" />
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
            const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url

            return (
              <Card
                key={property.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${!property.is_active && property.status !== "occupied" ? "opacity-75" : ""}`}
              >
                <div className="relative h-48">
                  {primaryImage ? (
                    <Image
                      src={primaryImage || "/placeholder.svg"}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(property.status, property.is_active)}>
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

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.township?.name}, {property.township?.municipality}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">{getPropertyTypeLabel(property.property_type)}</Badge>
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
                          <Coins className="h-4 w-4" />R{property.rent_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per month</div>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Link href={`/landlord/properties/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
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
                        onClick={() => togglePropertyStatus(property.id, property.status, property.is_active)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
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
