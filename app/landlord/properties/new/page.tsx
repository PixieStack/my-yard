"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Plus, Loader2, ArrowLeft, Search } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { SOUTH_AFRICAN_TOWNSHIPS, searchTownships, type StaticTownship } from "@/lib/data/townships"

// Use static townships as the source of truth
interface LocationOption {
  value: string // JSON encoded: {name, city, province}
  label: string
  township: StaticTownship
}

interface PropertyFormData {
  title: string
  description: string
  property_type: "room" | "bachelor" | "cottage" | ""
  rent_amount: string
  deposit_amount: string
  bedrooms: string
  bathrooms: string
  square_meters: string
  address: string
  location_name: string
  location_city: string
  location_province: string
  is_furnished: boolean
  pets_allowed: boolean
  smoking_allowed: boolean
  parking_spaces: string
  garden_access: boolean
  wifi_included: boolean
  electricity_included: boolean
  water_included: boolean
  gas_included: boolean
  available_from: string
  lease_duration_months: string
  minimum_lease_months: string
}

export default function AddPropertyPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState("")
  
  // Location search state
  const [locationSearch, setLocationSearch] = useState("")
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([])
  const [selectedLocation, setSelectedLocation] = useState<StaticTownship | null>(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    property_type: "",
    rent_amount: "",
    deposit_amount: "",
    bedrooms: "1",
    bathrooms: "1",
    square_meters: "",
    address: "",
    township_id: "",
    is_furnished: false,
    pets_allowed: false,
    smoking_allowed: false,
    parking_spaces: "0",
    garden_access: false,
    wifi_included: false,
    electricity_included: false,
    water_included: false,
    gas_included: false,
    available_from: "",
    lease_duration_months: "12",
    minimum_lease_months: "6",
  })

  useEffect(() => {
    fetchTownships()
  }, [])

  const fetchTownships = async () => {
    try {
      const { data } = await supabase.from("townships").select("id, name, municipality").order("name")
      setTownships(data || [])
    } catch (error) {
      console.error("Error fetching townships:", error)
    }
  }

  const handleInputChange = (field: keyof PropertyFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB

      if (!isValidType) {
        setError(`${file.name} is not a supported image format`)
        return false
      }
      if (!isValidSize) {
        setError(`${file.name} is too large. Maximum size is 10MB`)
        return false
      }
      return true
    })

    const totalImages = images.length + validFiles.length
    if (totalImages > 10) {
      setError(`You can only upload up to 10 images. You're trying to add ${totalImages} images.`)
      return
    }

    setImages((prev) => [...prev, ...validFiles])
    setError("") // Clear any previous errors
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities((prev) => [...prev, newAmenity.trim()])
      setNewAmenity("")
    }
  }

  const removeAmenity = (amenity: string) => {
    setAmenities((prev) => prev.filter((a) => a !== amenity))
  }

  const uploadImages = async (propertyId: string) => {
    if (images.length === 0) return

    try {
      const uploadPromises = images.map(async (image, index) => {
        console.log(`Processing image ${index + 1}/${images.length}: ${image.name}`)

        // Convert image to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(image)
        })

        return {
          property_id: propertyId,
          image_url: base64,
          is_primary: index === 0,
          display_order: index,
          caption: `Property image ${index + 1}`,
          image_type: "property",
        }
      })

      console.log("Processing all images...")
      const imageData = await Promise.all(uploadPromises)

      console.log("Saving image data to database...")
      const { error: dbError } = await supabase.from("property_images").insert(imageData)

      if (dbError) {
        console.error("Error saving image data:", dbError)
        throw new Error(`Failed to save image information: ${dbError.message}`)
      }

      console.log(`Successfully processed ${images.length} images`)
    } catch (error) {
      console.error("Image processing error:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      if (
        !formData.title ||
        !formData.property_type ||
        !formData.rent_amount ||
        !formData.address ||
        !formData.township_id
      ) {
        setError("Please fill in all required fields")
        return
      }

      if (!profile?.id) {
        setError("You must be logged in to create a property")
        return
      }

      console.log("Creating property with profile ID:", profile.id)

      const propertyData = {
        landlord_id: profile.id,
        township_id: formData.township_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        property_type: formData.property_type,
        rent_amount: Number.parseFloat(formData.rent_amount),
        deposit_amount: formData.deposit_amount ? Number.parseFloat(formData.deposit_amount) : null,
        bedrooms: Number.parseInt(formData.bedrooms),
        bathrooms: Number.parseInt(formData.bathrooms),
        square_meters: formData.square_meters ? Number.parseInt(formData.square_meters) : null,
        address: formData.address.trim(),
        is_furnished: formData.is_furnished,
        pets_allowed: formData.pets_allowed,
        smoking_allowed: formData.smoking_allowed,
        parking_spaces: Number.parseInt(formData.parking_spaces),
        garden_access: formData.garden_access,
        wifi_included: formData.wifi_included,
        electricity_included: formData.electricity_included,
        water_included: formData.water_included,
        gas_included: formData.gas_included,
        available_from: formData.available_from || null,
        lease_duration_months: Number.parseInt(formData.lease_duration_months),
        minimum_lease_months: Number.parseInt(formData.minimum_lease_months),
        status: "available",
        is_active: true,
      }

      console.log("Inserting property data:", propertyData)

      const { data: createdProperty, error: propertyError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select("id")
        .single()

      if (propertyError) {
        console.error("Property creation error:", propertyError)
        setError(`Failed to create property: ${propertyError.message}`)
        return
      }

      const propertyId = createdProperty.id
      console.log("Property created successfully with ID:", propertyId)

      if (images.length > 0) {
        console.log("Processing images...")
        await uploadImages(propertyId)
      }

      if (amenities.length > 0) {
        console.log("Saving amenities...")
        const amenityData = amenities.map((amenity) => ({
          property_id: propertyId,
          amenity_category: "general",
          amenity_name: amenity,
          amenity_description: amenity,
          is_included_in_rent: true,
        }))

        const { error: amenityError } = await supabase.from("property_amenities").insert(amenityData)

        if (amenityError) {
          console.error("Error saving amenities:", amenityError)
          // Don't fail the entire process for amenity errors
        }
      }

      console.log("Property created successfully")
      setSuccess("Property created successfully! Redirecting...")

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/landlord/properties")
      }, 1500)
    } catch (error: any) {
      console.error("Error creating property:", error)
      setError(error.message || "Failed to create property. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/landlord/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
          <p className="text-gray-600">List your property for rent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the essential details about your property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Cozy 2-bedroom cottage in Soweto"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange("property_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="cottage">Cottage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property, its features, and what makes it special..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where is your property located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="township">Township *</Label>
                <Select value={formData.township_id} onValueChange={(value) => handleInputChange("township_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select township" />
                  </SelectTrigger>
                  <SelectContent>
                    {townships.map((township) => (
                      <SelectItem key={township.id} value={township.id}>
                        {township.name}, {township.municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Specify the size and features of your property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange("bedrooms", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Select value={formData.bathrooms} onValueChange={(value) => handleInputChange("bathrooms", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="square_meters">Size (m²)</Label>
                <Input
                  id="square_meters"
                  type="number"
                  placeholder="50"
                  value={formData.square_meters}
                  onChange={(e) => handleInputChange("square_meters", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parking_spaces">Parking Spaces</Label>
                <Select
                  value={formData.parking_spaces}
                  onValueChange={(value) => handleInputChange("parking_spaces", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Property Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_furnished"
                    checked={formData.is_furnished}
                    onCheckedChange={(checked) => handleInputChange("is_furnished", checked as boolean)}
                  />
                  <Label htmlFor="is_furnished">Furnished</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pets_allowed"
                    checked={formData.pets_allowed}
                    onCheckedChange={(checked) => handleInputChange("pets_allowed", checked as boolean)}
                  />
                  <Label htmlFor="pets_allowed">Pets Allowed</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smoking_allowed"
                    checked={formData.smoking_allowed}
                    onCheckedChange={(checked) => handleInputChange("smoking_allowed", checked as boolean)}
                  />
                  <Label htmlFor="smoking_allowed">Smoking Allowed</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="garden_access"
                    checked={formData.garden_access}
                    onCheckedChange={(checked) => handleInputChange("garden_access", checked as boolean)}
                  />
                  <Label htmlFor="garden_access">Garden Access</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wifi_included"
                    checked={formData.wifi_included}
                    onCheckedChange={(checked) => handleInputChange("wifi_included", checked as boolean)}
                  />
                  <Label htmlFor="wifi_included">WiFi Included</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="electricity_included"
                    checked={formData.electricity_included}
                    onCheckedChange={(checked) => handleInputChange("electricity_included", checked as boolean)}
                  />
                  <Label htmlFor="electricity_included">Electricity Included</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="water_included"
                    checked={formData.water_included}
                    onCheckedChange={(checked) => handleInputChange("water_included", checked as boolean)}
                  />
                  <Label htmlFor="water_included">Water Included</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gas_included"
                    checked={formData.gas_included}
                    onCheckedChange={(checked) => handleInputChange("gas_included", checked as boolean)}
                  />
                  <Label htmlFor="gas_included">Gas Included</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Availability</CardTitle>
            <CardDescription>Set your rental terms and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_amount">Monthly Rent (R) *</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  placeholder="3500"
                  value={formData.rent_amount}
                  onChange={(e) => handleInputChange("rent_amount", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit Amount (R)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  placeholder="3500"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => handleInputChange("available_from", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lease_duration_months">Preferred Lease Duration (months)</Label>
                <Select
                  value={formData.lease_duration_months}
                  onValueChange={(value) => handleInputChange("lease_duration_months", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 12, 18, 24, 36].map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_lease_months">Minimum Lease Duration (months)</Label>
                <Select
                  value={formData.minimum_lease_months}
                  onValueChange={(value) => handleInputChange("minimum_lease_months", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 12, 18, 24].map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
            <CardDescription>Upload photos of your property (max 10 images)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <Label htmlFor="images" className="cursor-pointer text-blue-600 hover:text-blue-500">
                  Click to upload images
                </Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image) || "/placeholder.svg"}
                      alt={`Property ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Amenities</CardTitle>
            <CardDescription>Add any extra amenities or features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Swimming pool, Security guard, etc."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                    <span>{amenity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeAmenity(amenity)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/landlord/properties">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Property
          </Button>
        </div>
      </form>
    </div>
  )
}
