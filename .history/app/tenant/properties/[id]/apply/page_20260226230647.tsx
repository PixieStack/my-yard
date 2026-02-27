"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Building, MapPin, DollarSign } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

interface Property {
  id: string
  title: string
  rent_amount: number
  deposit_amount: number
  address: string
  property_type: string
  bedrooms: number
  bathrooms: number
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
    profiles: {
      first_name: string
      last_name: string
    }
  }
}

interface ApplicationData {
  proposed_move_in_date: string
  lease_duration_requested: string
  additional_occupants: string
  additional_occupants_details: string
  special_requests: string
  tenant_notes: string
  credit_check_consent: boolean
  background_check_consent: boolean
}

export default function ApplyPropertyPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasExistingApplication, setHasExistingApplication] = useState(false)

  const [formData, setFormData] = useState<ApplicationData>({
    proposed_move_in_date: "",
    lease_duration_requested: "12",
    additional_occupants: "0",
    additional_occupants_details: "",
    special_requests: "",
    tenant_notes: "",
    credit_check_consent: false,
    background_check_consent: false,
  })

  useEffect(() => {
    if (id && profile?.id) {
      fetchProperty()
      checkExistingApplication()
    }
  }, [id, profile?.id])

  const fetchProperty = async () => {
    try {
      console.log("Fetching property with ID:", id)

      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select(`
          id, title, rent_amount, deposit_amount, address, property_type, 
          bedrooms, bathrooms, landlord_id,
          township:townships(name, municipality),
          property_images(image_url, is_primary)
        `)
        .eq("id", id)
        .eq("status", "available")
        .eq("is_active", true)
        .single()

      if (propertyError) {
        console.error("Error fetching property:", propertyError)
        setError("Property not found or no longer available")
        return
      }

      if (!propertyData) {
        console.error("No property data returned")
        setError("Property not found")
        return
      }

      let landlordData = { first_name: "Unknown", last_name: "Landlord" }
      if (propertyData.landlord_id) {
        const { data: landlord, error: landlordError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", propertyData.landlord_id)
          .single()

        if (landlord && !landlordError) {
          landlordData = landlord
        }
      }

      const property = {
        ...propertyData,
        township: propertyData.township || { name: "Unknown", municipality: "Unknown" },
        property_images: propertyData.property_images || [],
        landlord: {
          profiles: landlordData,
        },
      }

      setProperty(property)
    } catch (error) {
      console.error("Error fetching property:", error)
      setError("Failed to load property details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const checkExistingApplication = async () => {
    try {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("property_id", id)
        .eq("tenant_id", profile?.id)
        .single()

      if (data) {
        setHasExistingApplication(true)
      }
    } catch (error) {
      console.log("No existing application found (this is normal)")
    }
  }

  const handleInputChange = (field: keyof ApplicationData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      console.log("Starting application submission...")
      console.log("Profile ID:", profile?.id)
      console.log("Property ID:", id)

      if (!profile?.id) {
        setError("You must be logged in to apply for properties")
        return
      }

      if (!formData.credit_check_consent || !formData.background_check_consent) {
        setError("You must consent to credit and background checks to apply")
        return
      }

      if (!formData.proposed_move_in_date) {
        setError("Please select your proposed move-in date")
        return
      }

      const applicationData = {
        property_id: id,
        tenant_id: profile?.id,
        status: "pending",
        proposed_move_in_date: formData.proposed_move_in_date,
        lease_duration_requested: Number.parseInt(formData.lease_duration_requested),
        additional_occupants: Number.parseInt(formData.additional_occupants),
        additional_occupants_details: formData.additional_occupants_details || null,
        special_requests: formData.special_requests || null,
        tenant_notes: formData.tenant_notes || null,
        credit_check_consent: formData.credit_check_consent,
        background_check_consent: formData.background_check_consent,
        applied_at: new Date().toISOString(),
      }

      console.log("Application data:", applicationData)

      const { data, error } = await supabase.from("applications").insert(applicationData).select()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      console.log("Application submitted successfully:", data)

      if (property?.landlord_id) {
        await supabase.from("notifications").insert({
          user_id: property.landlord_id,
          type: "application",
          title: "New Application Received",
          message: `${profile.first_name} ${profile.last_name} has applied for ${property.title}`,
          action_url: `/landlord/applications`,
        })
      }

      setSuccess("Application submitted successfully! The landlord will review your application and get back to you.")
      setTimeout(() => {
        router.push("/tenant/applications")
      }, 3000)
    } catch (err: any) {
      console.error("Application submission error:", err)
      setError(err.message || "An error occurred while submitting your application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">{error || "Property not found"}</h3>
        <p className="text-gray-600 mb-4">
          {error
            ? "There was an issue loading this property."
            : "This property may have been removed or is no longer available."}
        </p>
        <Link href="/tenant/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    )
  }

  if (hasExistingApplication) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/tenant/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Already Submitted</h3>
            <p className="text-gray-600 mb-4">You have already applied for this property.</p>
            <Link href="/tenant/applications">
              <Button>View My Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const primaryImage = property.property_images?.find((img) => img.is_primary)?.image_url

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/tenant/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apply for Property</h2>
          <p className="text-gray-600">Submit your rental application</p>
        </div>
      </div>

      {/* Property Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
              {primaryImage ? (
                <Image src={primaryImage || "/placeholder.svg"} alt={property.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{property.title}</h3>
              <p className="text-gray-600 flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {property.township.name}, {property.township.municipality}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-600 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span>R{property.rent_amount.toLocaleString()}/month</span>
                </div>
                <Badge variant="outline">
                  {property.bedrooms} bed, {property.bathrooms} bath
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Landlord: {property.landlord?.profiles?.first_name || "Unknown"}{" "}
                {property.landlord?.profiles?.last_name || "Landlord"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
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

        {/* Move-in Details */}
        <Card>
          <CardHeader>
            <CardTitle>Move-in Details</CardTitle>
            <CardDescription>When would you like to move in?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposed_move_in_date">Proposed Move-in Date *</Label>
                <Input
                  id="proposed_move_in_date"
                  type="date"
                  value={formData.proposed_move_in_date}
                  onChange={(e) => handleInputChange("proposed_move_in_date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease_duration_requested">Preferred Lease Duration</Label>
                <Select
                  value={formData.lease_duration_requested}
                  onValueChange={(value) => handleInputChange("lease_duration_requested", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Details */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Details</CardTitle>
            <CardDescription>Who will be living in the property?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additional_occupants">Additional Occupants (besides yourself)</Label>
              <Select
                value={formData.additional_occupants}
                onValueChange={(value) => handleInputChange("additional_occupants", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {Number.parseInt(formData.additional_occupants) > 0 && (
              <div className="space-y-2">
                <Label htmlFor="additional_occupants_details">Additional Occupants Details</Label>
                <Textarea
                  id="additional_occupants_details"
                  placeholder="Please provide names, ages, and relationship to you for each additional occupant"
                  value={formData.additional_occupants_details}
                  onChange={(e) => handleInputChange("additional_occupants_details", e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Any special requests or additional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                placeholder="Any special requests or accommodations needed (optional)"
                value={formData.special_requests}
                onChange={(e) => handleInputChange("special_requests", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_notes">Message to Landlord</Label>
              <Textarea
                id="tenant_notes"
                placeholder="Introduce yourself and explain why you'd be a great tenant (optional)"
                value={formData.tenant_notes}
                onChange={(e) => handleInputChange("tenant_notes", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consent */}
        <Card>
          <CardHeader>
            <CardTitle>Consent & Authorization</CardTitle>
            <CardDescription>Required consents for application processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="credit_check_consent"
                checked={formData.credit_check_consent}
                onCheckedChange={(checked) => handleInputChange("credit_check_consent", checked as boolean)}
                required
              />
              <Label htmlFor="credit_check_consent" className="text-sm leading-5">
                I consent to a credit check being performed as part of this rental application. I understand that this
                may affect my credit score.
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="background_check_consent"
                checked={formData.background_check_consent}
                onCheckedChange={(checked) => handleInputChange("background_check_consent", checked as boolean)}
                required
              />
              <Label htmlFor="background_check_consent" className="text-sm leading-5">
                I consent to a background check being performed and authorize the landlord to verify my employment,
                income, and rental history.
              </Label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your application will be reviewed by the landlord. You will be notified of the
                decision via email and through your MyYard dashboard. Processing typically takes 1-3 business days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/tenant/properties">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  )
}
