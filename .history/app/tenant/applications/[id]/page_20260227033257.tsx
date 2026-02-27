"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft, Building, MapPin, Bed, Bath, Coins,
  Heart, Calendar, User, Phone, Mail,
  Wifi, Zap, Droplets, Flame, CheckCircle, XCircle
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
  furnished: boolean
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
  created_at: string
  landlord_id: string
  property_images: Array<{
    image_url: string
    is_primary: boolean
    display_order: number
  }>
  landlord: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
  } | null
}

// ── Single image with error fallback ─────────────────────────────────────────
function Img({
  src,
  alt,
  className = "",
}: {
  src: string
  alt: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)

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
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      onError={() => {
        console.warn("❌ Image failed:", src.substring(0, 80))
        setErrored(true)
      }}
      onLoad={() => console.log("✅ Image OK:", src.substring(0, 60))}
    />
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProperty()
      if (profile?.id) {
        checkFavorite()
        checkApplication()
      }
    }
  }, [id, profile?.id])

  const fetchProperty = async () => {
    setFetchError("")
    try {
      console.log("🔍 Fetching property detail:", id)

      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, property_type,
          rent_amount, deposit_amount, bedrooms, bathrooms,
          address, location_name, location_city, location_province,
          city, province, is_furnished, furnished, pets_allowed,
          smoking_allowed, parking_spaces, garden_access,
          wifi_included, electricity_included, water_included, gas_included,
          available_from, lease_duration_months, minimum_lease_months,
          created_at, landlord_id,
          property_images (
            image_url, is_primary, display_order
          )
        `)
        .eq("id", id)
        .eq("status", "available")
        .eq("is_active", true)
        .single()

      if (error) {
        console.error("❌ Property error:", {
          message: error.message,
          code: error.code,
        })
        if (error.code === "PGRST116") setNotFound(true)
        else setFetchError(error.message)
        return
      }

      if (!data) { setNotFound(true); return }

      console.log("✅ Property:", data.title)
      console.log("📸 Images:", data.property_images?.length ?? 0)

      // Sort: primary first, then by display_order
      const sortedImages = [...(data.property_images || [])].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return (a.display_order ?? 0) - (b.display_order ?? 0)
      })

      // Fetch landlord
      let landlord = null
      if (data.landlord_id) {
        const { data: ld, error: ldErr } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, email")
          .eq("id", data.landlord_id)
          .maybeSingle()
        if (ldErr) console.warn("⚠️ Landlord fetch failed:", ldErr.message)
        else landlord = ld
      }

      setProperty({ ...data, property_images: sortedImages, landlord })
    } catch (err: any) {
      console.error("❌ Unexpected:", err)
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkFavorite = async () => {
    try {
      const { data } = await supabase.from("favorites").select("id")
        .eq("user_id", profile?.id).eq("property_id", id).maybeSingle()
      setIsFavorite(!!data)
    } catch (err) { console.error(err) }
  }

  const checkApplication = async () => {
    try {
      const { data } = await supabase.from("applications").select("id")
        .eq("tenant_id", profile?.id).eq("property_id", id).maybeSingle()
      setHasApplied(!!data)
    } catch (err) { console.error(err) }
  }

  const toggleFavorite = async () => {
    if (!profile?.id) return
        try {
      if (isFavorite) {
        await supabase.from("favorites").delete()
          .eq("user_id", profile.id).eq("property_id", id)
        setIsFavorite(false)
      } else {
        await supabase.from("favorites").insert({ user_id: profile.id, property_id: id })
        setIsFavorite(true)
      }
    } catch (err) { console.error("Favorite error:", err) }
  }

  const getLocationDisplay = () => {
    if (!property) return ""
    if (property.location_name) {
      return [property.location_name, property.location_city, property.location_province]
        .filter(Boolean).join(", ")
    }
    return [property.city, property.province].filter(Boolean).join(", ") || property.address
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "room": return "Room"
      case "bachelor": return "Bachelor"
      case "cottage": return "Cottage"
      default: return type
    }
  }

  const isFurnished = property?.is_furnished || property?.furnished

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Failed to load property: {fetchError}</AlertDescription>
        </Alert>
        <Link href="/tenant/properties">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Properties
          </Button>
        </Link>
      </div>
    )
  }

  if (notFound || !property) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Property not found</h3>
        <p className="text-gray-600 mb-4">
          This property may have been removed or is no longer available.
        </p>
        <Link href="/tenant/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    )
  }

  const allImages = property.property_images || []
  const currentImage = allImages[selectedIndex]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/tenant/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
            <p className="text-gray-600 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 shrink-0" />
              {getLocationDisplay()}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={toggleFavorite}>
          <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
          {isFavorite ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Image Gallery */}
      {allImages.length > 0 ? (
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative h-80 md:h-[420px] rounded-xl overflow-hidden bg-gray-100">
            {currentImage ? (
              <Img
                src={currentImage.image_url}
                alt={`${property.title} image ${selectedIndex + 1}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Building className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {allImages.length > 1 && (
              <>
                {/* Prev button */}
                <button
                  onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                  disabled={selectedIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center disabled:opacity-30 transition"
                >
                  ‹
                </button>
                {/* Next button */}
                <button
                  onClick={() => setSelectedIndex((i) => Math.min(allImages.length - 1, i + 1))}
                  disabled={selectedIndex === allImages.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center disabled:opacity-30 transition"
                >
                  ›
                </button>
                {/* Counter */}
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {selectedIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === index
                      ? "border-blue-500 opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Img src={img.image_url} alt={`Thumb ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No images available</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left — details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">{property.bedrooms}</div>
                  <div className="text-xs text-gray-500">
                    Bedroom{property.bedrooms !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">{property.bathrooms}</div>
                  <div className="text-xs text-gray-500">
                    Bathroom{property.bathrooms !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Building className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">
                    {getTypeLabel(property.property_type)}
                  </div>
                  <div className="text-xs text-gray-500">Type</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">
                    {property.available_from
                      ? new Date(property.available_from).toLocaleDateString("en-ZA", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "Now"}
                  </div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2">
                {isFurnished && <Badge variant="secondary">✅ Furnished</Badge>}
                {property.pets_allowed && <Badge variant="secondary">🐾 Pets Allowed</Badge>}
                {property.smoking_allowed && <Badge variant="secondary">🚬 Smoking Allowed</Badge>}
                {property.garden_access && <Badge variant="secondary">🌿 Garden Access</Badge>}
                {property.parking_spaces > 0 && (
                  <Badge variant="secondary">🚗 {property.parking_spaces} Parking</Badge>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Description</h4>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Address */}
              <div>
                <h4 className="font-medium mb-2 text-gray-900">Address</h4>
                <p className="text-gray-600 flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  {[
                    property.address,
                    property.location_name,
                    property.location_city || property.city,
                    property.location_province || property.province,
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Utilities */}
          <Card>
            <CardHeader>
              <CardTitle>What's Included in Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "WiFi", icon: Wifi, included: property.wifi_included },
                  { label: "Electricity", icon: Zap, included: property.electricity_included },
                  { label: "Water", icon: Droplets, included: property.water_included },
                  { label: "Gas", icon: Flame, included: property.gas_included },
                ].map(({ label, icon: Icon, included }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      included
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                    {included
                      ? <CheckCircle className="h-3 w-3 ml-auto" />
                      : <XCircle className="h-3 w-3 ml-auto opacity-40" />
                    }
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lease */}
          <Card>
            <CardHeader>
              <CardTitle>Lease Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Preferred Duration</div>
                  <div className="font-medium">{property.lease_duration_months} months</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Minimum Duration</div>
                  <div className="font-medium">{property.minimum_lease_months} months</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Monthly Rent</span>
                <div className="flex items-center text-2xl font-bold text-green-600">
                  <Coins className="h-5 w-5 mr-1" />
                  R{property.rent_amount.toLocaleString()}
                </div>
              </div>
              {property.deposit_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Security Deposit</span>
                  <span className="font-semibold">R{property.deposit_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Est. Move-in Cost</span>
                  <span className="font-medium text-gray-700">
                    R{(property.rent_amount + (property.deposit_amount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Landlord */}
          <Card>
            <CardHeader><CardTitle>Landlord</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {property.landlord ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
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
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{property.landlord.phone}</span>
                    </div>
                  )}
                  {property.landlord.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{property.landlord.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Landlord info unavailable</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {hasApplied ? (
                <div className="text-center py-2">
                  <Badge variant="outline" className="mb-2 border-green-500 text-green-600">
                    ✅ Application Submitted
                  </Badge>
                  <p className="text-sm text-gray-600 mb-3">
                    You have already applied for this property
                  </p>
                  <Link href="/tenant/applications" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      View My Application
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href={`/tenant/properties/${property.id}/apply`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Apply Now
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full" onClick={toggleFavorite}>
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                {isFavorite ? "Remove from Saved" : "Save Property"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}