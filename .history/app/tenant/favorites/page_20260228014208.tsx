"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Search, MapPin, Bed, Bath, Coins, Eye, Trash2, Building } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

interface FavoriteProperty {
  id: string
  created_at: string
  property: {
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
    status: string
    township: {
      name: string
      municipality: string
    }
    property_images: Array<{
      image_url: string
      is_primary: boolean
    }>
  }
}

export default function TenantFavoritesPage() {
  const { profile } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [propertyType, setPropertyType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    if (profile?.id) {
      fetchFavorites()
    }
  }, [profile?.id])

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id, created_at,
          property:properties(
            id, title, description, property_type, rent_amount, deposit_amount,
            bedrooms, bathrooms, address, is_furnished, pets_allowed, status,
            township:townships(name, municipality),
            property_images(image_url, is_primary)
          )
        `)
        .eq("user_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching favorites:", error instanceof Error ? error.message : JSON.stringify(error))
        return
      }

      setFavorites(data || [])
    } catch (error) {
      console.error("Error fetching favorites:", error instanceof Error ? error.message : JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)

      if (error) throw error

      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId))
    } catch (error) {
      console.error("Error removing favorite:", error)
    }
  }

  const filteredFavorites = favorites.filter((favorite) => {
    const property = favorite.property
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.township?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = propertyType === "all" || property.property_type === propertyType

    return matchesSearch && matchesType
  })

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "price-low":
        return a.property.rent_amount - b.property.rent_amount
      case "price-high":
        return b.property.rent_amount - a.property.rent_amount
      default:
        return 0
    }
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
          <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
          <p className="text-gray-600">Properties you've saved for later</p>
        </div>
        <Link href="/tenant/properties">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse More
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
                  placeholder="Search favorites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={propertyType} onValueChange={setPropertyType}>
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {sortedFavorites.length} favorite{sortedFavorites.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Favorites Grid */}
      {sortedFavorites.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedFavorites.map((favorite) => {
            const property = favorite.property
            const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url

            return (
              <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 bg-white/90 hover:bg-white"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {property.status !== "available" && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {property.status}
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

                    <div className="text-xs text-gray-500">
                      Added to favorites {new Date(favorite.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Link href={`/tenant/properties/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      {property.status === "available" && (
                        <Link href={`/tenant/properties/${property.id}/apply`}>
                          <Button size="sm">Apply</Button>
                        </Link>
                      )}
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
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || propertyType !== "all"
                ? "Try adjusting your search or filters"
                : "You haven't saved any properties yet"}
            </p>
            {!searchTerm && propertyType === "all" && (
              <Link href="/tenant/properties">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
