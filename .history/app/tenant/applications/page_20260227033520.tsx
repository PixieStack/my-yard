"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Building, Search, MapPin, Bed, Bath, Coins,
  Heart, Eye, Filter, X, ChevronLeft, ChevronRight
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
  is_furnished: boolean
  pets_allowed: boolean
  created_at: string
  property_images: Array<{
    image_url: string
    is_primary: boolean
    display_order: number
  }>
}

interface LocationOption {
  name: string
  city: string
  province: string
  display: string
}

const ITEMS_PER_PAGE = 12

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
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className}`}>
        <Building className="h-10 w-10 text-gray-400 mb-1" />
        <span className="text-xs text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className={`object-cover ${className}`}
      onError={() => {
        console.warn("❌ Image failed:", src.substring(0, 80))
        setErrored(true)
      }}
      onLoad={() => console.log("✅ Image loaded:", src.substring(0, 60))}
    />
  )
}

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
    <div className="flex items-center justify-between pt-6 border-t mt-2">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{start}</span>–
        <span className="font-medium">{end}</span> of{" "}
        <span className="font-medium">{totalItems}</span> properties
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm" className="h-8 w-8 p-0"
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
          variant="outline" size="sm" className="h-8 w-8 p-0"
          onClick={() => goTo(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function BrowsePropertiesPage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [furnished, setFurnished] = useState<string>("all")
  const [petsAllowed, setPetsAllowed] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)
  const paginated = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    fetchProperties()
    if (profile?.id) fetchFavorites()
  }, [profile?.id])

  const fetchProperties = async () => {
    try {
      console.log("🔍 Fetching properties...")
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, property_type,
          rent_amount, deposit_amount, bedrooms, bathrooms,
          address, location_name, location_city, location_province,
          city, province, is_furnished, pets_allowed, created_at,
          property_images (
            image_url, is_primary, display_order
          )
        `)
        .eq("status", "available")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Fetch error:", {
          message: error.message,
          code: error.code,
          details: error.details,
        })
        return
      }

      const props = data || []
      console.log(`✅ Fetched ${props.length} properties`)
      props.forEach((p) => {
        const imgs = p.property_images || []
        console.log(`📸 "${p.title}": ${imgs.length} images`, imgs.map(i => ({
          primary: i.is_primary,
          order: i.display_order,
          url: i.image_url?.substring(0, 80),
        })))
      })

      setProperties(props)
      setFilteredProperties(props)

      const map = new Map<string, LocationOption>()
      props.forEach((p) => {
        const name = p.location_name || p.city || ""
        const city = p.location_city || p.city || ""
        const province = p.location_province || p.province || ""
        if (name) {
          const key = `${name}|${city}`
          if (!map.has(key)) {
            map.set(key, {
              name, city, province,
              display: city && city !== name ? `${name}, ${city}` : name,
            })
          }
        }
      })
      setLocationOptions(
        Array.from(map.values()).sort((a, b) => a.display.localeCompare(b.display))
      )
    } catch (err: any) {
      console.error("❌ Unexpected:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase
        .from("favorites").select("property_id").eq("user_id", profile?.id)
      setFavorites(new Set(data?.map((f) => f.property_id) || []))
    } catch (err) { console.error("Favorites error:", err) }
  }

  const applyFilters = useCallback(() => {
    const result = properties.filter((p) => {
      const locText = [
        p.location_name, p.location_city, p.location_province,
        p.city, p.province, p.address,
      ].filter(Boolean).join(" ").toLowerCase()

      const matchSearch = !searchTerm.trim() ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locText.includes(searchTerm.toLowerCase())

      const matchLocation = selectedLocation === "all" ||
        p.location_name === selectedLocation || p.city === selectedLocation

      const matchType = propertyType === "all" || p.property_type === propertyType
      const matchPrice = p.rent_amount >= priceRange[0] && p.rent_amount <= priceRange[1]
      const matchFurnished = furnished === "all" || (furnished === "yes") === p.is_furnished
      const matchPets = petsAllowed === "all" || (petsAllowed === "yes") === p.pets_allowed

      return matchSearch && matchLocation && matchType && matchPrice && matchFurnished && matchPets
    })
    setFilteredProperties(result)
    setCurrentPage(1)
  }, [searchTerm, selectedLocation, propertyType, priceRange, furnished, petsAllowed, properties])

  useEffect(() => {
    if (properties.length > 0) applyFilters()
  }, [applyFilters])

  const toggleFavorite = async (propertyId: string) => {
    if (!profile?.id) return
    try {
      if (favorites.has(propertyId)) {
        await supabase.from("favorites").delete()
          .eq("user_id", profile.id).eq("property_id", propertyId)
        setFavorites((prev) => { const n = new Set(prev); n.delete(propertyId); return n })
      } else {
        await supabase.from("favorites").insert({ user_id: profile.id, property_id: propertyId })
        setFavorites((prev) => new Set(prev).add(propertyId))
      }
    } catch (err) { console.error("Favorite error:", err) }
  }

  const getLocationDisplay = (p: Property) => {
    if (p.location_name) return [p.location_name, p.location_city].filter(Boolean).join(", ")
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "room": return "Room"
      case "bachelor": return "Bachelor"
      case "cottage": return "Cottage"
      default: return type
    }
  }

  const clearFilters = () => {
    setSearchTerm(""); setSelectedLocation("all"); setPropertyType("all")
    setPriceRange([0, 10000]); setFurnished("all"); setPetsAllowed("all")
  }

  const hasActiveFilters = searchTerm !== "" || selectedLocation !== "all" ||
    propertyType !== "all" || priceRange[0] > 0 || priceRange[1] < 10000 ||
    furnished !== "all" || petsAllowed !== "all"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Browse Properties</h2>
          <p className="text-gray-600">Find your perfect township home</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">!</Badge>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, township, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!showFilters && locationOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLocation("all")}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedLocation === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                All Areas
              </button>
              {locationOptions.slice(0, 8).map((loc) => (
                <button
                  key={`${loc.name}|${loc.city}`}
                  onClick={() => setSelectedLocation(loc.name)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedLocation === loc.name
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {loc.name}
                </button>
              ))}
              {locationOptions.length > 8 && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-3 py-1 rounded-full text-sm border border-gray-200 text-gray-500 hover:border-blue-400"
                >
                  +{locationOptions.length - 8} more
                </button>
              )}
            </div>
          )}

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Township / Area</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger><SelectValue placeholder="All Areas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {locationOptions.map((loc) => (
                      <SelectItem key={`${loc.name}|${loc.city}`} value={loc.name}>
                        {loc.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Property Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="cottage">Cottage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Furnished</label>
                <Select value={furnished} onValueChange={setFurnished}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="yes">Furnished</SelectItem>
                    <SelectItem value="no">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Pets Allowed</label>
                <Select value={petsAllowed} onValueChange={setPetsAllowed}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="yes">Pets Allowed</SelectItem>
                    <SelectItem value="no">No Pets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Price: R{priceRange[0].toLocaleString()} — R{priceRange[1].toLocaleString()}
                  {priceRange[1] >= 10000 ? "+" : ""}
                </label>
                <Slider value={priceRange} onValueChange={setPriceRange}
                  max={10000} min={0} step={500} className="w-full" />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
              <span className="text-xs text-gray-500">Active:</span>
              {selectedLocation !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  📍 {selectedLocation}
                  <button onClick={() => setSelectedLocation("all")}><X className="h-3 w-3 ml-1" /></button>
                </Badge>
              )}
              {propertyType !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  🏠 {getTypeLabel(propertyType)}
                  <button onClick={() => setPropertyType("all")}><X className="h-3 w-3 ml-1" /></button>
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  💰 R{priceRange[0].toLocaleString()}–R{priceRange[1].toLocaleString()}
                  <button onClick={() => setPriceRange([0, 10000])}><X className="h-3 w-3 ml-1" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{filteredProperties.length}</span>
          {" "}propert{filteredProperties.length !== 1 ? "ies" : "y"} found
          {selectedLocation !== "all" && (
            <span className="text-blue-600"> in {selectedLocation}</span>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
        )}
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((property) => {
              const isFavorite = favorites.has(property.id)
              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-100">
                    <PropertyImage
                      images={property.property_images}
                      title={property.title}
                      className="w-full h-full"
                    />
                    <Button
                      variant="ghost" size="sm"
                      className={`absolute top-2 right-2 h-8 w-8 p-0 rounded-full shadow ${
                        isFavorite ? "text-red-500 bg-white" : "text-gray-600 bg-white/90"
                      }`}
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-black/60 text-white border-0 text-xs">
                        {getTypeLabel(property.property_type)}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1 shrink-0" />
                      <span className="line-clamp-1">{getLocationDisplay(property)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />{property.bedrooms}
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />{property.bathrooms}
                        </div>
                        {property.is_furnished && (
                          <Badge variant="secondary" className="text-xs">Furnished</Badge>
                        )}
                        {property.pets_allowed && (
                          <Badge variant="secondary" className="text-xs">🐾 Pets</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center text-lg font-bold text-green-600">
                            <Coins className="h-4 w-4 mr-1" />
                            R{property.rent_amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">per month</div>
                        </div>
                        {property.deposit_amount > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Deposit</div>
                            <div className="text-sm font-medium">
                              R{property.deposit_amount.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <Link href={`/tenant/properties/${property.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Eye className="mr-2 h-4 w-4" />View
                          </Button>
                        </Link>
                        <Link href={`/tenant/properties/${property.id}/apply`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Apply</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProperties.length}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters ? "Try adjusting your search or filters" : "No properties available"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}