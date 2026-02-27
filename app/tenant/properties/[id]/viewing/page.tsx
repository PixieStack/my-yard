"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string
  title: string
  address: string
  rent_amount: number
  property_type: string
  location_name: string | null
  location_city: string | null
  location_province: string | null
  city: string | null
  province: string | null
  property_images: Array<{
    image_url: string
    is_primary: boolean
    display_order: number
  }>
}

interface ExistingViewing {
  id: string
  status: string
  requested_date: string
  requested_time: string
  landlord_response: string | null
}

// ─── PropertyImage ────────────────────────────────────────────────────────────

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
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <Building className="h-8 w-8 text-gray-400" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={title}
      className={`object-cover ${className}`}
      onError={() => setErrored(true)}
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RequestViewingPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [existingViewing, setExistingViewing] = useState<ExistingViewing | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [requestedDate, setRequestedDate] = useState("")
  const [requestedTime, setRequestedTime] = useState("10:00")
  const [message, setMessage] = useState("")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (id && profile?.id) {
      fetchData()
    }
  }, [id, profile?.id])

  const fetchData = async () => {
    try {
      const [propertyResult, viewingResult] = await Promise.all([
        supabase
          .from("properties")
          .select(`
            id, title, address, rent_amount, property_type,
            location_name, location_city, location_province, city, province,
            property_images (image_url, is_primary, display_order)
          `)
          .eq("id", id)
          .eq("status", "available")
          .eq("is_active", true)
          .single(),

        supabase
          .from("viewing_requests")
          .select("id, status, requested_date, requested_time, landlord_response")
          .eq("property_id", id)
          .eq("tenant_id", profile!.id)
          .maybeSingle(),
      ])

      if (propertyResult.error || !propertyResult.data) {
        setError("Property not found or no longer available.")
        return
      }

      setProperty(propertyResult.data as Property)
      setExistingViewing(viewingResult.data ?? null)
    } catch (err) {
      setError("Failed to load property details.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !property) return

    if (!requestedDate) {
      setError("Please select a preferred date.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const { error: insertError } = await supabase
        .from("viewing_requests")
        .insert({
          property_id: property.id,
          tenant_id: profile.id,
          requested_date: requestedDate,
          requested_time: requestedTime,
          tenant_message: message.trim() || null,
          status: "pending",
        })

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already submitted a viewing request for this property.")
        } else {
          setError(`Failed to submit: ${insertError.message}`)
        }
        return
      }

      setSubmitted(true)
      await fetchData()
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getLocationDisplay = (p: Property) => {
    if (p.location_name) {
      return [p.location_name, p.location_city].filter(Boolean).join(", ")
    }
    return [p.city, p.province].filter(Boolean).join(", ") || p.address
  }

  const getViewingStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-green-100 text-green-800"
      case "declined": return "bg-red-100 text-red-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getViewingStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Awaiting Landlord Confirmation"
      case "confirmed": return "Viewing Confirmed"
      case "declined": return "Viewing Declined"
      case "completed": return "Viewing Completed"
      default: return status
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error && !property) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href={`/tenant/properties/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!property) return null

  // ─── Already has a viewing ─────────────────────────────────────────────────

  if (existingViewing) {
    const isConfirmedOrCompleted =
      existingViewing.status === "confirmed" || existingViewing.status === "completed"

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/tenant/properties/${property.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
        </Link>

        <Card>
          <div className="h-40 overflow-hidden rounded-t-lg">
            <PropertyImage
              images={property.property_images}
              title={property.title}
              className="w-full h-full"
            />
          </div>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-lg">{property.title}</h3>
            <p className="text-gray-600 flex items-center text-sm mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {getLocationDisplay(property)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Your Viewing Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge className={getViewingStatusColor(existingViewing.status)}>
                {getViewingStatusText(existingViewing.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requested Date</span>
              <span className="font-medium text-sm">
                {new Date(existingViewing.requested_date).toLocaleDateString("en-ZA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requested Time</span>
              <span className="font-medium text-sm">{existingViewing.requested_time}</span>
            </div>
            {existingViewing.landlord_response && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Landlord Response</p>
                <p className="text-sm text-gray-700">{existingViewing.landlord_response}</p>
              </div>
            )}

            {isConfirmedOrCompleted ? (
              <div className="pt-2 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">
                        {existingViewing.status === "confirmed"
                          ? "Viewing Confirmed — You Can Now Apply!"
                          : "Viewing Completed — Submit Your Application!"}
                      </p>
                      <p className="text-green-700 text-sm mt-1">
                        Your viewing has been{" "}
                        {existingViewing.status === "confirmed" ? "confirmed" : "completed"}.
                        You are now eligible to submit a full rental application.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push(`/tenant/properties/${property.id}/apply`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Proceed to Application
                </Button>
              </div>
            ) : existingViewing.status === "declined" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900">Viewing Declined</p>
                <p className="text-red-700 text-sm mt-1">
                  The landlord has declined this viewing request.
                  You may browse other available properties.
                </p>
                <Link href="/tenant/properties" className="block mt-3">
                  <Button variant="outline" size="sm">Browse Other Properties</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Waiting for confirmation.</strong> The landlord will respond to your
                  viewing request. You will be able to apply once it is confirmed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Submitted confirmation screen ────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Viewing Request Sent!</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Your request to view <strong>{property.title}</strong> has been sent to the landlord.
              You will be notified once they confirm.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-blue-800">
              <p className="font-semibold mb-1">What happens next?</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Landlord reviews and confirms your viewing</li>
                <li>You attend the property viewing</li>
                <li>After confirmation, you can submit a full application</li>
                <li>If approved, a lease agreement is generated</li>
              </ol>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/tenant/applications">
                <Button variant="outline">View My Applications</Button>
              </Link>
              <Link href="/tenant/properties">
                <Button>Browse More Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Request form ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/tenant/properties/${property.id}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Property
        </Button>
      </Link>

      {/* Property Summary */}
      <Card>
        <div className="h-40 overflow-hidden rounded-t-lg">
          <PropertyImage
            images={property.property_images}
            title={property.title}
            className="w-full h-full"
          />
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg">{property.title}</h3>
          <p className="text-gray-600 flex items-center text-sm mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {getLocationDisplay(property)}
          </p>
          <p className="text-green-600 font-semibold mt-2">
            R{property.rent_amount.toLocaleString()}/month
          </p>
        </CardContent>
      </Card>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
          <div>
            <p className="text-sm font-medium text-blue-600">Request Viewing</p>
            <p className="text-xs text-gray-500">Current step</p>
          </div>
        </div>
        <div className="h-px bg-gray-200 flex-1" />
        <div className="flex items-center gap-2 flex-1">
          <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold shrink-0">2</div>
          <div>
            <p className="text-sm font-medium text-gray-400">Submit Application</p>
            <p className="text-xs text-gray-500">After viewing</p>
          </div>
        </div>
        <div className="h-px bg-gray-200 flex-1" />
        <div className="flex items-center gap-2 flex-1">
          <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold shrink-0">3</div>
          <div>
            <p className="text-sm font-medium text-gray-400">Sign Lease</p>
            <p className="text-xs text-gray-500">If approved</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request a Property Viewing</CardTitle>
          <CardDescription>
            Choose a date and time that works for you. The landlord will confirm or suggest
            an alternative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Preferred Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="pl-10"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="time"
                    type="time"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message to Landlord (optional)</Label>
              <Textarea
                id="message"
                placeholder="e.g., I am available on weekday mornings. Please let me know if this time works..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Note:</strong> You will only be able to submit a full rental application
              after your viewing has been confirmed by the landlord.
            </div>

            <div className="flex gap-3 pt-1">
              <Link href={`/tenant/properties/${property.id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Request Viewing
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}