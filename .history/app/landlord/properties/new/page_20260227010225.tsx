"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Upload, X, Plus, Loader2, ArrowLeft, Search, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { searchTownships, type StaticTownship } from "@/lib/data/townships"

interface LocationOption {
  value: string
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
  const [today, setToday] = useState("")

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
    location_name: "",
    location_city: "",
    location_province: "",
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

  // Set today's date on client side only (avoids hydration mismatch)
  useEffect(() => {
    const date = new Date()
    setToday(date.toISOString().split("T")[0])
  }, [])

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced location search
  useEffect(() => {
    if (locationSearch.length < 2) {
      setLocationOptions([])
      setShowLocationDropdown(false)
      return
    }

    const results = searchTownships(locationSearch).slice(0, 20)
    const options: LocationOption[] = results.map((t) => ({
      value: JSON.stringify({ name: t.name, city: t.city, province: t.province }),
      label: `${t.name}, ${t.city}, ${t.province}`,
      township: t,
    }))
    setLocationOptions(options)
    setShowLocationDropdown(options.length > 0)
  }, [locationSearch])

  const handleInputChange = (field: keyof PropertyFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const selectLocation = (option: LocationOption) => {
    setSelectedLocation(option.township)
    setLocationSearch(option.label)
    setFormData((prev) => ({
      ...prev,
      location_name: option.township.name,
      location_city: option.township.city,
      location_province: option.township.province,
    }))
    setShowLocationDropdown(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB

      if (!isValidType) {
        setError(`${file.name} is not a supported image format (use JPG, PNG, GIF, or WebP)`)
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
      setError(`Maximum 10 images allowed. You have ${images.length} and tried to add ${validFiles.length}.`)
      return
    }

    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    setImages((prev) => [...prev, ...validFiles])
    setError("")
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index])
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
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

    const uploadPromises = images.map(async (image, index) => {
      console.log(`Uploading image ${index + 1}/${images.length}: ${image.name}`)

      const fileExt = image.name.split(".").pop()
      const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, image, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.warn(`⚠️ Storage upload failed for image ${index + 1}, using base64 fallback:`, uploadError.message)

        // Fallback to base64 if storage fails
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
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName)

      return {
        property_id: propertyId,
        image_url: publicUrl,
        is_primary: index === 0,
        display_order: index,
        caption: `Property image ${index + 1}`,
        image_type: "property",
      }
    })

    const imageData = await Promise.all(uploadPromises)

    const { error: dbError } = await supabase.from("property_images").insert(imageData)

    if (dbError) {
      console.error("❌ Error saving image records to DB:", dbError)
      throw new Error(`Failed to save image records: ${dbError.message}`)
    }

    console.log(`✅ Successfully saved ${images.length} image(s)`)
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Property title is required"
    if (!formData.property_type) return "Please select a property type"
    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0)
      return "Please enter a valid monthly rent amount"
    if (!formData.address.trim()) return "Street address is required"
    if (!formData.location_name) return "Please select a location from the dropdown"

    if (formData.available_from) {
      const availableDate = new Date(formData.available_from)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      if (availableDate < todayDate) return "Available from date cannot be in the past"
    }

    const minLease = parseInt(formData.minimum_lease_months)
    const prefLease = parseInt(formData.lease_duration_months)
    if (minLease > prefLease) return "Minimum lease duration cannot exceed preferred lease duration"

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // --- Validate form ---
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      // --- Check auth ---
      if (!profile?.id) {
        setError("You must be logged in to create a property")
        setLoading(false)
        return
      }

      console.log("🏠 Creating property for landlord:", profile.id)

      // --- Build property object matching EXACT DB columns ---
      const propertyData = {
        landlord_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        property_type: formData.property_type,
        rent_amount: parseFloat(formData.rent_amount),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        square_meters: formData.square_meters ? parseInt(formData.square_meters) : null,
        address: formData.address.trim(),
        // Location fields
        location_name: formData.location_name || null,
        location_city: formData.location_city || null,
        location_province: formData.location_province || null,
        // Boolean features
        is_furnished: formData.is_furnished,
        furnished: formData.is_furnished, // DB has both columns
        pets_allowed: formData.pets_allowed,
        smoking_allowed: formData.smoking_allowed,
        parking_spaces: parseInt(formData.parking_spaces),
        garden_access: formData.garden_access,
        wifi_included: formData.wifi_included,
        electricity_included: formData.electricity_included,
        water_included: formData.water_included,
        gas_included: formData.gas_included,
        // Dates & lease
        available_from: formData.available_from || null,
        lease_duration_months: parseInt(formData.lease_duration_months),
        minimum_lease_months: parseInt(formData.minimum_lease_months),
        // Status
        status: "available",
        is_active: true,
        // township_id is nullable so we omit it
      }

      console.log("📦 Property payload:", propertyData)

      // --- Insert with 15s timeout ---
      const insertWithTimeout = async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Check your internet connection.")), 15000)
        )

        const insertPromise = supabase
          .from("properties")
          .insert(propertyData)
          .select("id")
          .single()

        return Promise.race([insertPromise, timeoutPromise])
      }

      const { data: createdProperty, error: propertyError } = await insertWithTimeout() as any

      if (propertyError) {
        console.error("❌ Supabase insert error:", {
          message: propertyError.message,
          code: propertyError.code,
          details: propertyError.details,
          hint: propertyError.hint,
        })
        setError(`Failed to save property: ${propertyError.message}`)
        setLoading(false)
        return
      }

      if (!createdProperty?.id) {
        console.error("❌ No ID returned from insert")
        setError("Property was not saved. Please try again.")
        setLoading(false)
        return
      }

      const propertyId = createdProperty.id
      console.log("✅ Property saved with ID:", propertyId)

      // --- Upload images (non-blocking) ---
      if (images.length > 0) {
        console.log("🖼️ Uploading images...")
        try {
          await uploadImages(propertyId)
        } catch (imgError: any) {
          console.warn("⚠️ Image upload issue (property still saved):", imgError.message)
          // Property is saved — don't block on image errors
        }
      }

      // --- Save amenities (non-blocking) ---
      if (amenities.length > 0) {
        console.log("🏷️ Saving amenities...")
        const amenityData = amenities.map((amenity) => ({
          property_id: propertyId,
          amenity_name: amenity,
          amenity_category: "general",
          amenity_description: amenity,
          is_included_in_rent: true,
        }))

        const { error: amenityError } = await supabase
          .from("property_amenities")
          .insert(amenityData)

        if (amenityError) {
          console.warn("⚠️ Amenity save issue (property still saved):", amenityError.message)
          // Don't block on amenity errors
        } else {
          console.log("✅ Amenities saved")
        }
      }

      // --- Success ---
      setSuccess("Property listed successfully! Redirecting...")
      console.log("🎉 All done!")

      setTimeout(() => {
        router.push("/landlord/properties")
      }, 1500)

    } catch (err: any) {
      console.error("❌ Unexpected error during property creation:", err)
      setError(err.message || "Something went wrong. Please try again.")
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
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
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
                <Label htmlFor="title">
                  Property Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Cozy 2-bedroom cottage in Soweto"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange("property_type", value)}
                  disabled={loading}
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
                disabled={loading}
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
              {/* Township Search */}
              <div className="space-y-2 relative">
                <Label htmlFor="location">
                  Township / Area <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="Search township, suburb, or city..."
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value)
                      if (selectedLocation) {
                        setSelectedLocation(null)
                        setFormData((prev) => ({
                          ...prev,
                          location_name: "",
                          location_city: "",
                          location_province: "",
                        }))
                      }
                    }}
                    onFocus={() => locationOptions.length > 0 && setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    className="pl-10"
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                {/* Dropdown */}
                {showLocationDropdown && locationOptions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {locationOptions.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        onMouseDown={() => selectLocation(option)}
                      >
                        <span className="font-medium">{option.township.name}</span>
                        <span className="text-gray-500 ml-1">
                          — {option.township.city}, {option.township.province}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.township.type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected location confirmation */}
                {selectedLocation && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {selectedLocation.name}, {selectedLocation.city}, {selectedLocation.province}
                  </p>
                )}

                {/* No results hint */}
                {locationSearch.length >= 2 && locationOptions.length === 0 && !selectedLocation && (
                  <p className="text-sm text-gray-500">No townships found for "{locationSearch}"</p>
                )}
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={loading}
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
                <Label>Bedrooms</Label>
                <Select
                  value={formData.bedrooms}
                  onValueChange={(value) => handleInputChange("bedrooms", value)}
                  disabled={loading}
                >
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
                <Label>Bathrooms</Label>
                <Select
                  value={formData.bathrooms}
                  onValueChange={(value) => handleInputChange("bathrooms", value)}
                  disabled={loading}
                >
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
                  min="0"
                  value={formData.square_meters}
                  onChange={(e) => handleInputChange("square_meters", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Parking Spaces</Label>
                <Select
                  value={formData.parking_spaces}
                  onValueChange={(value) => handleInputChange("parking_spaces", value)}
                  disabled={loading}
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

            {/* Features Checkboxes */}
            <div className="space-y-3">
              <Label>Property Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "is_furnished", label: "Furnished" },
                  { id: "pets_allowed", label: "Pets Allowed" },
                  { id: "smoking_allowed", label: "Smoking Allowed" },
                  { id: "garden_access", label: "Garden Access" },
                  { id: "wifi_included", label: "WiFi Included" },
                  { id: "electricity_included", label: "Electricity Included" },
                  { id: "water_included", label: "Water Included" },
                  { id: "gas_included", label: "Gas Included" },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={formData[id as keyof PropertyFormData] as boolean}
                      onCheckedChange={(checked) =>
                        handleInputChange(id as keyof PropertyFormData, checked as boolean)
                      }
                      disabled={loading}
                    />
                    <Label htmlFor={id} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
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
                <Label htmlFor="rent_amount">
                  Monthly Rent (R) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rent_amount"
                  type="number"
                  placeholder="3500"
                  min="0"
                  value={formData.rent_amount}
                  onChange={(e) => handleInputChange("rent_amount", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit Amount (R)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  placeholder="3500"
                  min="0"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  min={today}
                  value={formData.available_from}
                  onChange={(e) => handleInputChange("available_from", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Lease Duration (months)</Label>
                <Select
                  value={formData.lease_duration_months}
                  onValueChange={(value) => handleInputChange("lease_duration_months", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 12, 18, 24, 36].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Lease Duration (months)</Label>
                <Select
                  value={formData.minimum_lease_months}
                  onValueChange={(value) => handleInputChange("minimum_lease_months", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 12, 18, 24].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m} months
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
            <CardDescription>Upload up to 10 photos of your property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <Label
                  htmlFor="images"
                  className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
                >
                  Click to upload images
                </Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">JPG, PNG, GIF, WebP — up to 10MB each</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imagePreviewUrls[index] || "/placeholder.svg"}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <Badge className="absolute bottom-1 left-1 text-xs bg-blue-600">
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <p className="text-sm text-gray-500">
                {images.length}/10 images added
              </p>
            )}
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Amenities</CardTitle>
            <CardDescription>Add any extra features not listed above</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Swimming pool, Security guard..."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addAmenity()
                  }
                }}
                disabled={loading}
              />
              <Button type="button" onClick={addAmenity} disabled={loading || !newAmenity.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="flex items-center gap-1 pr-1">
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-1 hover:text-red-500 disabled:opacity-50"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pb-8">
          <Link href="/landlord/properties">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Property"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}