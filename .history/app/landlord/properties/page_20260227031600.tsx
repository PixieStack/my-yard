"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building, Plus, Search, MapPin, Bed, Bath,
  Coins, Eye, Edit, ChevronLeft, ChevronRight
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

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
  location_name: string | null
  location_city: string | null
  location_province: string | null
  city: string | null
  province: string | null
  status: "available" | "occupied" | "maintenance"
  is_furnished: boolean
  is_active: boolean
  created_at: string
  property_images: Array<{
    image_url: string
    is_primary: boolean
    display_order: number
  }>
}

const ITEMS_PER_PAGE = 12

// ── Reusable image component ──────────────────────────────────────────────────
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

// ── Pagination component ──────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const goTo = (page: number) => {
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | "...")[] = [1]
    if (currentPage > 3) pages.push("...")
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems)

  return (
    <div className="flex items-center justify-between pt-6 border-t mt-6">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{start}</span>–
        <span className="font-medium">{end}</span> of{" "}
        <span className="font-medium">{totalItems}</span> properties
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goTo(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPages().map((page, i) =>
          page === "..." ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">...</span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 text-sm"
              onClick={() => goTo(page as number)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => goTo(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const { profile } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (profile?.id) fetchProperties()
  }, [profile?.id])

  const fetchProperties = async () => {
    setFetchError(null)
    try {
      console.log("🔍 Fetching landlord properties for:", profile?.id)
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, property_type,
          rent_amount, deposit_amount, bedrooms, bathrooms,
          address, location_name, location_city, location_province,
          city, province, status, is_furnished, is_active, created_at,
          property_images (
            image_url, is_primary, display_order
          )
        `)
        .eq("landlord_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Fetch error:", error)
        setFetchError(error.message)
        return
      }
      console.log(`✅ Fetched ${data?.length ?? 0} properties`)
      setProperties(data || [])
    } catch (err: any) {
      console.error("❌ Unexpected error:", err)
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePropertyStatus = async (
    propertyId: string,
    currentStatus: string,
  ) => {
    const newStatus =
      currentStatus === "available" ? "maintenance" : "available"
    const newIsActive = newStatus === "available"

    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus, is_active: newIsActive })
      .eq("id", propertyId)

    if (error) {
      console.error("Error updating status:", error)
      return
    }

    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, status: newStatus as any, is_active: newIsActive }
          : p
      )
    )
  }

  const getLocationDisplay = (p: Property) => {
    if (p.location_name) {
      return [p.location_name, p.location_city].filter(Boolean).join(", ")
    }
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

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
    if (!isActive && status !== "occupied") return "Deactivated"
    switch (status) {
      case "available": return "Available"
      case "occupied": return "Occupied"
      case "maintenance": return "Maintenance"
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "room": return "Room"
      case "bachelor": return "Bachelor"
      case "cottage": return "Cottage"
      default: return type
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = properties.filter((p) => {
    const location = getLocationDisplay(p).toLowerCase()
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    const matchesType = typeFilter === "all" || p.property_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(12)].map((_, i) => (
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
          <p className="text-gray-600">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} listed
          </p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Error */}
      {fetchError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-700 text-sm">❌ {fetchError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchProperties}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{filtered.length}</span> propert
          {filtered.length !== 1 ? "ies" : "y"} found
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((property) => (
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
                  <PropertyImage
                    images={property.property_images}
                    title={property.title}
                    className="w-full h-full"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(property.status, property.is_active)}>
                      {getStatusText(property.status, property.is_active)}
                    </Badge>
                  </div>
                  {!property.is_active && property.status !== "occupied" && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-white text-gray-800">
                        Not Available
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-1">
                    {property.title}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <span className="line-clamp-1">{getLocationDisplay(property)}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">{getTypeLabel(property.property_type)}</Badge>
                    </div>

                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms}
                      </div>
                      {property.is_furnished && (
                        <Badge variant="secondary" className="text-xs">Furnished</Badge>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center text-lg font-semibold text-green-600">
                        <Coins className="h-4 w-4 mr-1" />
                        R{property.rent_amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per month</div>
                    </div>

                    <div className="flex space-x-2 pt-1">
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
                        onClick={() => togglePropertyStatus(property.id, property.status)}
                        disabled={property.status === "occupied"}
                        className={
                          property.status === "available"
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {property.status === "available"
                          ? "Deactivate"
                          : property.status === "maintenance"
                          ? "Activate"
                          : "Occupied"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </>
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