"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Loader2,
  Lock,
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
  deposit_amount: number
  property_type: string
  bedrooms: number
  bathrooms: number
  lease_duration_months: number
  minimum_lease_months: number
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

interface ViewingRequest {
  id: string
  status: string
  requested_date: string
  requested_time: string
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

export default function ApplyForPropertyPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [viewing, setViewing] = useState<ViewingRequest | null>(null)
  const [existingApplication, setExistingApplication] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [pageError, setPageError] = useState("")

  // Form fields
  const [proposedMoveIn, setProposedMoveIn] = useState("")
  const [leaseDuration, setLeaseDuration] = useState("12")
  const [additionalOccupants, setAdditionalOccupants] = useState("0")
  const [occupantDetails, setOccupantDetails] = useState("")
  const [tenantNotes, setTenantNotes] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (id && profile?.id) {
      fetchData()
    }
  }, [id, profile?.id])

  const fetchData = async () => {
    try {
      const [propertyResult, viewingResult, applicationResult] = await Promise.all([
        supabase
          .from("properties")
          .select(`
            id, title, address, rent_amount, deposit_amount,
            property_type, bedrooms, bathrooms,
            lease_duration_months, minimum_lease_months,
            location_name, location_city, location_province, city, province,
            property_images (image_url, is_primary, display_order)
          `)
          .eq("id", id)
          .single(),

        supabase
          .from("viewing_requests")
          .select("id, status, requested_date, requested_time")
          .eq("property_id", id)
          .eq("tenant_id", profile!.id)
          .maybeSingle(),

        supabase
          .from("applications")
          .select("id")
          .eq("property_id", id)
          .eq("tenant_id", profile!.id)
          .maybeSingle(),
      ])

      if (propertyResult.error || !propertyResult.data) {
        setPageError("Property not found.")
        return
      }

      const prop = propertyResult.data as Property
      const view = viewingResult.data
      const app = applicationResult.data

      setProperty(prop)
      setViewing(view ?? null)
      setExistingApplication(app ?? null)

      // Set default lease duration from property
      setLeaseDuration(String(prop.lease_duration_months || 12))

      // Check if viewing is confirmed or completed
      if (!view || (view.status !== "confirmed" && view.status !== "completed")) {
        setPageError(
          view
            ? "Your viewing request is still pending confirmation. You can apply once the landlord confirms your viewing."
            : "You need to request a viewing before applying for this property."
        )
      }
    } catch (err) {
      setPageError("Failed to load page. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !property) return

    if (!proposedMoveIn) {
      setError("Please select a proposed move-in date.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const { data: newApp, error: insertError } = await supabase
        .from("applications")
        .insert({
          tenant_id: profile.id,
          property_id: property.id,
          status: "pending",
          proposed_move_in_date: proposedMoveIn,
          lease_duration_requested: parseInt(leaseDuration),
          additional_occupants: parseInt(additionalOccupants),
          additional_occupants_details: occupantDetails.trim() || null,
          tenant_notes: tenantNotes.trim() || null,
          special_requests: specialRequests.trim() || null,
        })
        .select("id")
        .single()

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already applied for this property.")
        } else {
          setError(`Failed to submit application: ${insertError.message}`)
        }
        return
      }

      // Update viewing request status to "application_submitted" if it exists
      if (viewing?.id) {
        await supabase
          .from("viewing_requests")
          .update({ status: "application_submitted" })
          .eq("id", viewing.id)
      }

      setSubmitted(true)
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

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  // ─── Already applied ──────────────────────────────────────────────────────

  if (existingApplication) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/tenant/properties/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Application Already Submitted</h2>
            <p className="text-gray-600">
              You have already applied for <strong>{property?.title}</strong>.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href={`/tenant/applications/${existingApplication.id}`}>
                <Button>
                  <Eye className="mr-2 h-4 w-4" />
                  View My Application
                </Button>
              </Link>
              <Link href="/tenant/applications">
                <Button variant="outline">All Applications</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Blocked — no viewing or viewing not confirmed ─────────────────────────

  if (pageError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/tenant/properties/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Viewing Required First</h2>
            <p className="text-gray-600 max-w-sm mx-auto">{pageError}</p>
            {property && (
              <div className="flex gap-3 justify-center pt-2">
                <Link href={`/tenant/properties/${property.id}/viewing`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="mr-2 h-4 w-4" />
                    {viewing ? "Check Viewing Status" : "Request a Viewing"}
                  </Button>
                </Link>
                <Link href={`/tenant/properties/${property.id}`}>
                  <Button variant="outline">Back to Property</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Submitted confirmation ───────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Your application for <strong>{property?.title}</strong> has been sent to the
              landlord for review.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-blue-800">
              <p className="font-semibold mb-1">What happens next?</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Landlord reviews your application</li>
                <li>If approved, a lease agreement will be generated</li>
                <li>You will receive the lease to review and sign</li>
                <li>After signing, complete your move-in payment</li>
              </ol>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/tenant/applications">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  View My Applications
                </Button>
              </Link>
              <Link href="/tenant/properties">
                <Button variant="outline">Browse Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!property) return null

  // ─── Application Form ─────────────────────────────────────────────────────

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
          <div className="flex items-center gap-4 mt-2">
            <span className="text-green-600 font-semibold">
              R{property.rent_amount.toLocaleString()}/month
            </span>
            {property.deposit_amount > 0 && (
              <span className="text-gray-500 text-sm">
                Deposit: R{property.deposit_amount.toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-600">Viewing Done</p>
            <p className="text-xs text-gray-500">Confirmed</p>
          </div>
        </div>
        <div className="h-px bg-green-300 flex-1" />
        <div className="flex items-center gap-2 flex-1">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
          <div>
            <p className="text-sm font-medium text-blue-600">Submit Application</p>
            <p className="text-xs text-gray-500">Current step</p>
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

      {/* Viewing confirmation badge */}
      {viewing && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            <strong>Viewing {viewing.status === "completed" ? "completed" : "confirmed"}</strong>{" "}
            for{" "}
            {new Date(viewing.requested_date).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            at {viewing.requested_time}
          </p>
        </div>
      )}

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Application</CardTitle>
          <CardDescription>
            Complete your application for {property.title}. The landlord will review and
            respond within a few days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Move-in & Lease */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                Lease Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movein">
                    Proposed Move-in Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="movein"
                      type="date"
                      min={today}
                      value={proposedMoveIn}
                      onChange={(e) => setProposedMoveIn(e.target.value)}
                      className="pl-10"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lease Duration</Label>
                  <Select
                    value={leaseDuration}
                    onValueChange={setLeaseDuration}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 6, 12, 18, 24, 36].map((m) => (
                        <SelectItem
                          key={m}
                          value={String(m)}
                          disabled={m < (property.minimum_lease_months || 0)}
                        >
                          {m} months{m < (property.minimum_lease_months || 0) ? " (below minimum)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Minimum: {property.minimum_lease_months} months
                  </p>
                </div>
              </div>
            </div>

            {/* Occupants */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                Occupants
              </h3>
              <div className="space-y-2">
                <Label>Additional Occupants (besides yourself)</Label>
                <Select
                  value={additionalOccupants}
                  onValueChange={setAdditionalOccupants}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 0 ? "Just me" : `${n} additional ${n === 1 ? "person" : "people"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {parseInt(additionalOccupants) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="occupant-details">
                    Occupant Details (names and relationship)
                  </Label>
                  <Textarea
                    id="occupant-details"
                    placeholder="e.g., Jane Doe (spouse), Tom Doe (child, age 5)"
                    value={occupantDetails}
                    onChange={(e) => setOccupantDetails(e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                Additional Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Message to Landlord (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tell the landlord a bit about yourself, your occupation, why you want this property..."
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="special">Special Requests (optional)</Label>
                <Textarea
                  id="special"
                  placeholder="e.g., May I paint one wall? I need to store a motorbike..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-700">Estimated Move-in Cost</p>
              <div className="flex justify-between text-gray-600">
                <span>Monthly Rent</span>
                <span>R{property.rent_amount.toLocaleString()}</span>
              </div>
              {property.deposit_amount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Security Deposit</span>
                  <span>R{property.deposit_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                <span>Estimated Total to Move In</span>
                <span>R{(property.rent_amount + (property.deposit_amount || 0)).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">
                Final amount confirmed in lease agreement if approved.
              </p>
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Application
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