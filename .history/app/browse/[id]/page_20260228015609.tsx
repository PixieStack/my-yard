'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building, MapPin, Bed, Bath, Coins, Heart, Calendar, User, Phone, Mail, Home, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Property {
  id: string
  title: string
  description: string
  property_type: 'room' | 'bachelor' | 'cottage'
  price_per_month: number
  bedrooms: number
  bathrooms: number
  size_sqm: number
  location: string
  township: string
  created_at: string
  landlord_id: string
  property_images?: Array<{
    image_url: string
    is_primary: boolean
  }>
  landlord?: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
}

export default function PublicPropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProperty()
    }
  }, [id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(image_url, is_primary),
          profiles:landlord_id(first_name, last_name, phone, email)
        `)
        .eq('id', id)
        .eq('status', 'available')
        .single()

      if (fetchError || !data) {
        setError('Property not found')
        return
      }

      const mappedProperty = {
        ...data,
        landlord: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      }
      setProperty(mappedProperty)
    } catch (err) {
      console.error('Error fetching property:', err)
      setError('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/browse/${id}`)
    } else {
      // Go to application page
      router.push(`/tenant/properties/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-96 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-semibold text-red-800 mb-2">Property Not Found</p>
              <p className="text-red-600">{error || 'The property you are looking for does not exist.'}</p>
              <Link href="/browse" className="mt-4 inline-block">
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Back to Browse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const images = property.property_images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative h-96 bg-gray-200 group">
                {primaryImage ? (
                  <Image
                    src={primaryImage.image_url}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <Home className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 bg-white border-t flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 transition ${
                        currentImageIndex === idx ? 'border-orange-600' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={img.image_url}
                        alt={`${property.title} thumbnail`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Type</p>
                    <p className="text-lg font-semibold capitalize">{property.property_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Size</p>
                    <p className="text-lg font-semibold">{property.size_sqm} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bedrooms</p>
                    <p className="text-lg font-semibold">{property.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bathrooms</p>
                    <p className="text-lg font-semibold">{property.bathrooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <p className="text-sm text-orange-700 mb-2">Monthly Rent</p>
                <p className="text-4xl font-bold text-orange-600 mb-6">
                  R{property.price_per_month.toLocaleString()}
                </p>
                <Button
                  onClick={handleApply}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 text-lg"
                >
                  Apply for This Property
                </Button>
                {!user && (
                  <p className="text-xs text-orange-700 mt-3 text-center">
                    You will be asked to sign in to complete your application
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{property.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Township</p>
                  <p className="font-medium">{property.township}</p>
                </div>
              </CardContent>
            </Card>

            {/* Landlord Card */}
            {property.landlord && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Landlord
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">
                      {property.landlord.first_name} {property.landlord.last_name}
                    </p>
                  </div>
                  {property.landlord.phone && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <a
                        href={`tel:${property.landlord.phone}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {property.landlord.phone}
                      </a>
                    </div>
                  )}
                  {property.landlord.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <a
                        href={`mailto:${property.landlord.email}`}
                        className="text-orange-600 hover:text-orange-700 font-medium break-all"
                      >
                        {property.landlord.email}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
