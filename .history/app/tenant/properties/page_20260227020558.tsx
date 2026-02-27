"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Building, Search, MapPin, Bed, Bath, Coins, Heart, Eye, Filter, X } from "lucide-react"
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
  // ✅ New location columns
  location_name: string | null
  location_city: string | null
  location_province: string | null
  // ✅ Legacy columns
  city: string | null
  province: string | null
  is_furnished: boolean
  pets_allowed: boolean
  created_at: string
  property_images: Array<{
    image_url: string
    is_primary: boolean
  }>
}

// All unique locations extracted from properties
interface LocationOption {
  name: string
  city: string
  province: string
  display: string
}

export default function BrowsePropertiesPage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [displayedProperties, setDisplayedProperties] = useState<Property[]>([])
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [furnished, setFurnished] = useState<string>("all")
  const [petsAllowed, setPetsAllowed] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // ── Fetch all properties once ────────────────────────────────────────────

  useEffect(() => {
    fetchProperties()
    if (profile?.id) {
      fetchFavorites()
    }
  }, [profile?.id])

  const fetchProperties = async () => {
    try {
      console.log("🔍 Fetching all available properties...")

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
          is_furnished,
          pets_allowed,
          created_at,
          property_images (
            image_url,
            is_primary
          )
        `)
        .eq("status", "available")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching properties:", error)
        return
      }

      console.log("✅ Properties fetched:", data?.length ?? 0)

      const props = data || []
      setProperties(props)

      // Show 10 random properties on initial load
      const shuffled = [...props].sort(() => Math.random() - 0.5)
      setDisplayedProperties(shuffled.slice(0, 10))

      // Build unique location options from property data
      const locationMap = new Map<string, LocationOption>()
      props.forEach((p) => {
        const name = p.location_name || p.city || ""
        const city = p.location_city || p.city || ""
        const province = p.location_province || p.province || ""
        if (name) {
          const key = `${name}-${city}`
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              name,
              city,
              province,
              display: city && city !== name ? `${name}, ${city}` : name,
            })
          }
        }
      })

      const sortedLocations = Array.from(locationMap.values()).sort((a, b) =>
        a.display.localeCompare(b.display)
      )
      setLocationOptions(sortedLocations)

    } catch (err: any) {
      console.error("❌ Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", profile?.id)
      setFavorites(new Set(data?.map((f) => f.property_id) || []))
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  // ── Filter logic ──────────────────────────────────────────────────────────

  const applyFilters = useCallback(() => {
    const isFiltering =
      searchTerm.trim() !== "" ||
      selectedLocation !== "all" ||
      propertyType !== "all" ||
      priceRange[0] > 0 ||
      priceRange[1] < 10000 ||
      furnished !== "all" ||
      petsAllowed !== "all"

    if (!isFiltering) {
      // No filters — show random 10
      const shuffled = [...properties].sort(() => Math.random() - 0.5)
      setDisplayedProperties(shuffled.slice(0, 10))
      setHasSearched(false)
      return
    }

    setHasSearched(true)

    const filtered = properties.filter((property) => {
      // Location display for search
      const locationDisplay = [
        property.location_name,
        property.location_city,
        property.location_province,
        property.city,
        property.province,
        property.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      // Search term — matches title, address, or any location field
      const matchesSearch =
        !searchTerm.trim() ||
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locationDisplay.includes(searchTerm.toLowerCase())

      // Township / location filter
      const matchesLocation =
        selectedLocation === "all" ||
        property.location_name === selectedLocation ||
        property.city === selectedLocation

      // Type filter
      const matchesType =
        propertyType === "all" || property.property_type === propertyType

      // Price filter
      const matchesPrice =
        property.rent_amount >= priceRange[0] &&
        property.rent_amount <= priceRange[1]

      // Furnished filter
      const matchesFurnished =
        furnished === "all" ||
        (furnished === "yes") === property.is_furnished

      // Pets filter
      const matchesPets =
        petsAllowed === "all" ||
        (petsAllowed === "yes") === property.pets_allowed

      return (
        matchesSearch &&
        matchesLocation &&
        matchesType &&
        matchesPrice &&
        matchesFurnished &&
        matchesPets
      )
    })

    setDisplayedProperties(filtered)
  }, [searchTerm, selectedLocation, propertyType, priceRange, furnished, petsAllowed, properties])

  // Re-run filters whenever any filter changes
  useEffect(() => {
    if (properties.length > 0) {
      applyFilters()
    }
  }, [applyFilters, properties])

  // ── Favorites ─────────────────────────────────────────────────────────────

  const toggleFavorite = async (propertyId: string) => {
    if (!profile?.id) return
    try {
      if (favorites.has(propertyId)) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", profile.id)
          .eq("property_id", propertyId)
        setFavorites((prev) => {
          const next = new Set(prev)
          next.delete(propertyId)
          return next
        })
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: profile.id, property_id: propertyId })
        setFavorites((prev) => new Set(prev).add(propertyId))
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getLocationDisplay = (property: Property): string => {
    if (property.location_name) {
      const parts = [property.location_name, property.location_city].filter(Boolean)
      return parts.join(", ")
    }
    if (property.city) {
      return [property.city, property.province].filter(Boolean).join(", ")
    }
    return property.address || "Location not specified"
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "room": return "Room"
      case "bachelor": return "Bachelor"
      case "cottage": return "Cottage"
      default: return type
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedLocation("all")
    setPropertyType("all")
    setPriceRange([0, 10000])
    setFurnished("all")
    setPetsAllowed("all")
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedLocation !== "all" ||
    propertyType !== "all" ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    furnished !== "all" ||
    petsAllowed !== "all"

  // ── Loading ───────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Browse Properties</h2>
          <p className="text-gray-600">
            {hasSearched
              ? `${displayedProperties.length} propert${displayedProperties.length !== 1 ? "ies" : "y"} found`
              : `Showing ${displayedProperties.length} properties — search or filter to explore more`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, township, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick township chips */}
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
                    key={`${loc.name}-${loc.city}`}
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

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2 border-t">
                {/* Township / Area */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Township / Area
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {locationOptions.map((loc) => (
                        <SelectItem
                          key={`${loc.name}-${loc.city}`}
                          value={loc.name}
                        >
                          {loc.display}
                          {loc.province && (
                            <span className="text-gray-400 ml-1">
                              ({loc.province})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Property Type
                  </label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
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

                {/* Furnished */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Furnished
                  </label>
                  <Select value={furnished} onValueChange={setFurnished}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="yes">Furnished</SelectItem>
                      <SelectItem value="no">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pets */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Pets Allowed
                  </label>
                  <Select value={petsAllowed} onValueChange={setPetsAllowed}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="yes">Pets Allowed</SelectItem>
                      <SelectItem value="no">No Pets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: R{priceRange[0].toLocaleString()} — R
                    {priceRange[1].toLocaleString()}
                    {priceRange[1] >= 10000 && "+"}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    min={0}
                    step={500}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Active filter tags + clear */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-gray-500">Active filters:</span>
                {selectedLocation !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    📍 {selectedLocation}
                    <button onClick={() => setSelectedLocation("all")}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {propertyType !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    🏠 {getPropertyTypeLabel(propertyType)}
                    <button onClick={() => setPropertyType("all")}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    💰 R{priceRange[0].toLocaleString()}–R{priceRange[1].toLocaleString()}
                    <button onClick={() => setPriceRange([0, 10000])}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {furnished !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    🛋️ {furnished === "yes" ? "Furnished" : "Unfurnished"}
                    <button onClick={() => setFurnished("all")}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-500 hover:text-red-600"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {hasSearched ? (
            <>
              <span className="font-medium">{displayedProperties.length}</span>
              {" "}propert{displayedProperties.length !== 1 ? "ies" : "y"} found
              {selectedLocation !== "all" && (
                <span className="text-blue-600"> in {selectedLocation}</span>
              )}
            </>
          ) : (
            <>
              Showing <span className="font-medium">{displayedProperties.length}</span> featured properties
              {" "}— use the search or filters above to find your perfect home
            </>
          )}
        </p>
        {hasSearched && displayedProperties.length > 0 && (
          <p className="text-xs text-gray-400">
            {properties.length} total available
          </p>
        )}
      </div>

      {/* Properties Grid */}
      {displayedProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedProperties.map((property) => {
            const primaryImage =
              property.property_images?.find((img) => img.is_primary)?.image_url ||
              property.property_images?.[0]?.image_url
            const isFavorite = favorites.has(property.id)

            return (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={property.title}
                      fill
                      className="object-cover"
                      unoptimized={primaryImage.startsWith("data:")}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Building className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {/* Favourite button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 h-8 w-8 p-0 rounded-full ${
                      isFavorite
                        ? "text-red-500 bg-white/90"
                        : "text-gray-600 bg-white/90"
                    }`}
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </Button>
                  {/* Type badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/60 text-white border-0 text-xs">
                      {getPropertyTypeLabel(property.property_type)}
                    </Badge>
                  </div>
                </div>

                {/* Header */}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-1">
                    {property.title}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <span className="line-clamp-1">
                      {getLocationDisplay(property)}
                    </span>
                  </CardDescription>
                </CardHeader>

                {/* Content */}
                <CardContent>
                  <div className="space-y-3">
                    {/* Beds / Baths / Features */}
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
                        <Badge variant="secondary" className="text-xs">
                          Furnished
                        </Badge>
                      )}
                      {property.pets_allowed && (
                        <Badge variant="secondary" className="text-xs">
                          🐾 Pets OK
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
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
                          <div className="text-sm font-medium text-gray-700">
                            R{property.deposit_amount.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-1">
                      <Link
                        href={`/tenant/properties/${property.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/tenant/properties/${property.id}/apply`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Apply
                        </Button>
                      </Link>
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
              {hasSearched
                ? `No properties match your criteria${selectedLocation !== "all" ? ` in ${selectedLocation}` : ""}`
                : "No properties are currently available"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}