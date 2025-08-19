"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building, MapPin, Bed, Bath, Coins, Heart, Calendar, User, Phone, Mail } from "lucide-react"
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
  landlord_id: string
  township: {
    name: string
    municipality: string
  }
  property_images: Array<{
    image_url: string
    is_primary: boolean
  }>
  landlord: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProperty()
      if (profile?.id) {
        checkFavoriteStatus()
        checkApplicationStatus()
      }
    }
  }, [id, profile?.id])

  const fetchProperty = async () => {
    try {
      // Fetch property data
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("status", "available")
        .eq("is_active", true)
        .single()

      if (propertyError || !propertyData) {
        console.error("Error fetching property:", propertyError)
        return
      }

      // Fetch township data separately
      const { data: township } = await supabase
        .from("townships")
        .select("name, municipality")
        .eq("id", propertyData.township_id)
        .maybeSingle()

      // Fetch property images separately
      const { data: images } = await supabase
        .from("property_images")
        .select("image_url, is_primary")
        .eq("property_id", propertyData.id)

      // Fetch landlord data separately
      const { data: landlord } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, email")
        .eq("id", propertyData.landlord_id)
        .maybeSingle()

      setProperty({
        ...propertyData,
        township: township || { name: "Unknown", municipality: "Unknown" },
        property_images: images || [],
        landlord: landlord || { first_name: "Unknown", last_name: "Landlord" },
      })
    } catch (error) {
      console.error("Error fetching property:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", profile?.id)
        .eq("property_id", id)
        .maybeSingle()

      setIsFavorite(!!data)
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const checkApplicationStatus = async () => {
    try {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("tenant_id", profile?.id)
        .eq("property_id", id)
        .maybeSingle()

      setHasApplied(!!data)
    } catch (error) {
      console.error("Error checking application status:", error)
    }
  }

  const toggleFavorite = async () => {
    if (!profile?.id) return

    try {
      if (isFavorite) {
        await supabase.from("favorites").delete().eq("user_id", profile.id).eq("property_id", id)
        setIsFavorite(false)
      } else {
        await supabase.from("favorites").insert({ user_id: profile.id, property_id: id })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
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
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2">
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
        <p className="text-gray-600 mb-4">This property may have been removed or is no longer available.</p>
        <Link href="/tenant/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    )
  }

  const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url
  const otherImages = property.property_images?.filter((img) => !img.is_primary) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tenant/properties">
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
        <Button variant="outline" onClick={toggleFavorite}>
          <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
          {isFavorite ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Images */}
      <div className="grid gap-4">
        {primaryImage && (
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image src={primaryImage || "/placeholder.svg"} alt={property.title} fill className="object-cover" />
          </div>
        )}
        {otherImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherImages.slice(0, 4).map((image, index) => (
              <div key={index} className="relative h-24 rounded-lg overflow-hidden">
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={`${property.title} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">{property.bedrooms} Bedrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">{property.bathrooms} Bathrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Building className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">{getPropertyTypeLabel(property.property_type)}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">Available Now</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {property.is_furnished && <Badge variant="secondary">Furnished</Badge>}
                {property.pets_allowed && <Badge variant="secondary">Pet Friendly</Badge>}
              </div>

              {property.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{property.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Address</h4>
                <p className="text-gray-600">{property.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Monthly Rent</span>
                <div className="flex items-center text-2xl font-bold text-green-600">
                  <Coins className="h-5 w-5 mr-1" />R{property.rent_amount.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-semibold">R{property.deposit_amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Landlord Info */}
          <Card>
            <CardHeader>
              <CardTitle>Landlord</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-medium">
                    {property.landlord.first_name} {property.landlord.last_name}
                  </div>
                  <div className="text-sm text-gray-500">Property Owner</div>
                </div>
              </div>
              {property.landlord.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{property.landlord.phone}</span>
                </div>
              )}
              {property.landlord.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{property.landlord.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {hasApplied ? (
                  <div className="text-center py-4">
                    <Badge variant="outline" className="mb-2">
                      Application Submitted
                    </Badge>
                    <p className="text-sm text-gray-600">You have already applied for this property</p>
                    <Link href="/tenant/applications" className="block mt-2">
                      <Button variant="outline" size="sm">
                        View Application
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/tenant/properties/${property.id}/apply`}>
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                  </Link>
                )}
                <Button variant="outline" className="w-full bg-transparent" onClick={toggleFavorite}>
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
