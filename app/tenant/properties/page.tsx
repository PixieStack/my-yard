"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Building, Search, MapPin, Bed, Bath, Coins, Heart, Eye, Filter } from "lucide-react"
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
  is_furnished: boolean
  pets_allowed: boolean
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

interface Township {
  id: string
  name: string
  municipality: string
}

export default function BrowsePropertiesPage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [townships, setTownships] = useState<Township[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedTownship, setSelectedTownship] = useState<string>("all")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [furnished, setFurnished] = useState<string>("all")
  const [petsAllowed, setPetsAllowed] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTownships()
    fetchProperties()
    if (profile?.id) {
      fetchFavorites()
    }
  }, [profile?.id])

  const fetchTownships = async () => {
    try {
      const { data } = await supabase.from("townships").select("id, name, municipality").order("name")
      setTownships(data || [])
    } catch (error) {
      console.error("Error fetching townships:", error)
    }
  }

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching properties:", error)
        return
      }

      // Fetch related data separately to avoid relationship errors
      const propertiesWithDetails = await Promise.all(
        (propertiesData || []).map(async (property) => {
          // Fetch township data
          const { data: township } = await supabase
            .from("townships")
            .select("name, municipality")
            .eq("id", property.township_id)
            .maybeSingle()

          // Fetch property images
          const { data: images } = await supabase
            .from("property_images")
            .select("image_url, is_primary")
            .eq("property_id", property.id)

          return {
            ...property,
            township: township || { name: "Unknown", municipality: "Unknown" },
            property_images: images || [],
          }
        }),
      )

      setProperties(propertiesWithDetails || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase.from("favorites").select("property_id").eq("user_id", profile?.id)
      setFavorites(new Set(data?.map((f) => f.property_id) || []))
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const toggleFavorite = async (propertyId: string) => {
    if (!profile?.id) return

    try {
      if (favorites.has(propertyId)) {
        await supabase.from("favorites").delete().eq("user_id", profile.id).eq("property_id", propertyId)
        setFavorites((prev) => {
          const newSet = new Set(prev)
          newSet.delete(propertyId)
          return newSet
        })
      } else {
        await supabase.from("favorites").insert({ user_id: profile.id, property_id: propertyId })
        setFavorites((prev) => new Set(prev).add(propertyId))
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.township?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTownship = selectedTownship === "all" || property.township?.name === selectedTownship
    const matchesType = propertyType === "all" || property.property_type === propertyType
    const matchesPrice = property.rent_amount >= priceRange[0] && property.rent_amount <= priceRange[1]
    const matchesFurnished = furnished === "all" || (furnished === "yes") === property.is_furnished
    const matchesPets = petsAllowed === "all" || (petsAllowed === "yes") === property.pets_allowed

    return matchesSearch && matchesTownship && matchesType && matchesPrice && matchesFurnished && matchesPets
  })

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
          <h2 className="text-2xl font-bold text-gray-900">Browse Properties</h2>
          <p className="text-gray-600">Find your perfect township home</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Township</label>
                  <Select value={selectedTownship} onValueChange={setSelectedTownship}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Townships" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Townships</SelectItem>
                      {townships.map((township) => (
                        <SelectItem key={township.id} value={township.name}>
                          {township.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Furnished</label>
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

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: R{priceRange[0].toLocaleString()} - R{priceRange[1].toLocaleString()}
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
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredProperties.length} propert{filteredProperties.length !== 1 ? "ies" : "y"} found
        </p>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url
            const isFavorite = favorites.has(property.id)

            return (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 h-8 w-8 p-0 ${
                      isFavorite ? "text-red-500 bg-white/90" : "text-gray-600 bg-white/90"
                    }`}
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
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
                      {property.pets_allowed && (
                        <Badge variant="secondary" className="text-xs">
                          Pet Friendly
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
                      <Link href={`/tenant/properties/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/tenant/properties/${property.id}/apply`}>
                        <Button size="sm">Apply</Button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedTownship("all")
                setPropertyType("all")
                setPriceRange([0, 10000])
                setFurnished("all")
                setPetsAllowed("all")
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
