"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  User,
  MapPin,
  Coins,
  Calendar,
  Phone,
  Mail,
  Building,
  CheckCircle,
  XCircle,
  MessageSquare,
  CalendarPlus2Icon as Calendar2,
  FileText,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface ApplicationDetails {
  id: string
  status: "pending" | "viewing_requested" | "viewing_scheduled" | "viewing_declined" | "approved" | "rejected"
  applied_at: string
  proposed_move_in_date: string
  lease_duration_requested: number
  additional_occupants: number
  additional_occupants_details: string
  tenant_notes: string
  special_requests: string
  rejection_reason: string | null
  tenant_id: string
  property: {
    id: string
    title: string
    address: string
    rent_amount: number
    deposit_amount: number
    property_type: string
    bedrooms: number
    bathrooms: number
    square_meters: number
    property_images: Array<{
      image_url: string
      is_primary: boolean
    }>
    township: {
      name: string
      municipality: string
    }
  }
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  tenant_profile: {
    employment_status: string
    monthly_income: number
    employer_name: string
    job_title: string
    current_address: string
    emergency_contact_name: string
    emergency_contact_phone: string
  }
  viewing_request?: {
    id: string
    requested_date: string
    requested_time: string
    status: string
    tenant_message: string
    landlord_response: string
  }
}

export default function ApplicationDetailsPage() {
  const { profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [rejectionDialog, setRejectionDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [viewingDialog, setViewingDialog] = useState(false)
  const [viewingDate, setViewingDate] = useState("")
  const [viewingMessage, setViewingMessage] = useState("")

  useEffect(() => {
    if (params.id && profile?.id) {
      fetchApplicationDetails()
    }
  }, [params.id, profile?.id])

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true)

      // Fetch application details
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(
            id, title, address, rent_amount, deposit_amount, property_type,
            bedrooms, bathrooms, square_meters,
            property_images(image_url, is_primary),
            township:townships(name, municipality)
          )
        `)
        .eq("id", params.id)
        .single()

      if (applicationError) throw applicationError

      // Fetch tenant profile
      const { data: tenantData, error: tenantError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("id", applicationData.tenant_id)
        .single()

      if (tenantError) throw tenantError

      // Fetch tenant profile details
      const { data: tenantProfileData, error: tenantProfileError } = await supabase
        .from("tenant_profiles")
        .select(`
          employment_status, monthly_income, employer_name, job_title,
          current_address, emergency_contact_name, emergency_contact_phone
        `)
        .eq("id", applicationData.tenant_id)
        .single()

      if (tenantProfileError) {
        console.warn("Tenant profile not found:", tenantProfileError)
      }

      // Fetch viewing request if exists
      const { data: viewingData, error: viewingError } = await supabase
        .from("viewing_requests")
        .select("*")
        .eq("property_id", applicationData.property.id)
        .eq("tenant_id", applicationData.tenant_id)
        .single()

      if (viewingError && viewingError.code !== "PGRST116") {
        console.warn("Viewing request not found:", viewingError)
      }

      setApplication({
        ...applicationData,
        tenant: tenantData,
        tenant_profile: tenantProfileData || {},
        viewing_request: viewingData || null,
      })
    } catch (error) {
      console.error("Error fetching application details:", error)
      setError("Failed to load application details")
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (status: "approved" | "rejected", reason?: string) => {
    if (!application) return

    try {
      const updateData: any = { status }
      if (reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase.from("applications").update(updateData).eq("id", application.id)

      if (error) throw error

      if (status === "approved") {
        // Create lease record
        const { error: leaseError } = await supabase.from("leases").insert({
          application_id: application.id,
          property_id: application.property.id,
          tenant_id: application.tenant_id,
          landlord_id: profile?.id,
          monthly_rent: application.property.rent_amount,
          start_date: application.proposed_move_in_date,
          end_date: new Date(
            new Date(application.proposed_move_in_date).setMonth(
              new Date(application.proposed_move_in_date).getMonth() + application.lease_duration_requested,
            ),
          )
            .toISOString()
            .split("T")[0],
          deposit_amount: application.property.deposit_amount,
          is_active: true,
          signed_by_landlord: true,
          signed_by_tenant: false,
        })

        if (leaseError) {
          console.error("Error creating lease:", leaseError)
        }

        // Send approval message
        await supabase.from("messages").insert({
          sender_id: profile?.id,
          recipient_id: application.tenant_id,
          property_id: application.property.id,
          subject: "Application Approved - Welcome to Your New Home!",
          message: `Congratulations! Your application for ${application.property.title} has been approved. Your lease will start on ${new Date(application.proposed_move_in_date).toLocaleDateString()}. Please contact me to arrange key collection and move-in details.`,
          message_type: "lease",
          requires_response: true,
        })
      } else if (status === "rejected" && reason) {
        // Send rejection message
        await supabase.from("messages").insert({
          sender_id: profile?.id,
          recipient_id: application.tenant_id,
          property_id: application.property.id,
          subject: "Application Update",
          message: `Thank you for your interest in ${application.property.title}. Unfortunately, we have decided to proceed with another applicant. Reason: ${reason}`,
          message_type: "application",
        })
      }

      setApplication((prev) => (prev ? { ...prev, status, rejection_reason: reason } : null))
      setRejectionDialog(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Error updating application:", error)
    }
  }

  const scheduleViewing = async () => {
    if (!application || !viewingDate) return

    try {
      const { error } = await supabase.from("viewing_requests").insert({
        property_id: application.property.id,
        tenant_id: application.tenant_id,
        requested_date: viewingDate.split("T")[0],
        requested_time: viewingDate.split("T")[1] || "10:00",
        status: "requested",
        tenant_message:
          viewingMessage ||
          `Viewing scheduled for ${new Date(viewingDate).toLocaleDateString()} at ${new Date(viewingDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      })

      if (error) throw error

      await supabase.from("applications").update({ status: "viewing_requested" }).eq("id", application.id)

      setApplication((prev) => (prev ? { ...prev, status: "viewing_requested" } : null))
      setViewingDialog(false)
      setViewingDate("")
      setViewingMessage("")
    } catch (error) {
      console.error("Error scheduling viewing:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "viewing_requested":
        return "bg-blue-100 text-blue-800"
      case "viewing_scheduled":
        return "bg-purple-100 text-purple-800"
      case "viewing_declined":
        return "bg-orange-100 text-orange-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/landlord/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
            <p className="text-gray-600">{error || "The application you're looking for doesn't exist."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const primaryImage = application.property.property_images?.find((img) => img.is_primary)?.image_url

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/landlord/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
            <p className="text-gray-600">Review application for {application.property.title}</p>
          </div>
        </div>
        <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                  {primaryImage ? (
                    <Image
                      src={primaryImage || "/placeholder.svg"}
                      alt={application.property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{application.property.title}</h3>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {application.property.address}
                  </p>
                  <p className="text-sm text-gray-500">
                    {application.property.township.name}, {application.property.township.municipality}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-semibold flex items-center">
                    <Coins className="h-4 w-4 mr-1" />R{application.property.rent_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deposit</p>
                  <p className="font-semibold">R{application.property.deposit_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-semibold">{application.property.property_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-semibold">{application.property.square_meters}m²</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Applied Date</p>
                  <p className="font-semibold">{new Date(application.applied_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proposed Move-in</p>
                  <p className="font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(application.proposed_move_in_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lease Duration</p>
                  <p className="font-semibold">{application.lease_duration_requested} months</p>
                </div>
              </div>

              {application.additional_occupants > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Additional Occupants</p>
                  <p className="font-semibold">{application.additional_occupants} additional people</p>
                  {application.additional_occupants_details && (
                    <p className="text-sm text-gray-500 mt-1">{application.additional_occupants_details}</p>
                  )}
                </div>
              )}

              {application.tenant_notes && (
                <div>
                  <p className="text-sm text-gray-600">Message from Tenant</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{application.tenant_notes}</p>
                  </div>
                </div>
              )}

              {application.special_requests && (
                <div>
                  <p className="text-sm text-gray-600">Special Requests</p>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">{application.special_requests}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viewing Request */}
          {application.viewing_request && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar2 className="h-5 w-5 mr-2" />
                  Viewing Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {new Date(
                          application.viewing_request.requested_date + "T" + application.viewing_request.requested_time,
                        ).toLocaleDateString()}
                        {" at "}
                        {new Date(
                          application.viewing_request.requested_date + "T" + application.viewing_request.requested_time,
                        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm text-gray-600">Status: {application.viewing_request.status}</p>
                    </div>
                  </div>
                  {application.viewing_request.tenant_message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{application.viewing_request.tenant_message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {application.tenant.first_name[0]}
                    {application.tenant.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">
                    {application.tenant.first_name} {application.tenant.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {application.tenant_profile.employment_status || "Employment status not provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {application.tenant.email}
                </div>
                {application.tenant.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {application.tenant.phone}
                  </div>
                )}
              </div>

              {application.tenant_profile.monthly_income && (
                <div>
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="font-semibold">R{application.tenant_profile.monthly_income.toLocaleString()}</p>
                </div>
              )}

              {application.tenant_profile.employer_name && (
                <div>
                  <p className="text-sm text-gray-600">Employer</p>
                  <p className="font-semibold">{application.tenant_profile.employer_name}</p>
                  {application.tenant_profile.job_title && (
                    <p className="text-sm text-gray-500">{application.tenant_profile.job_title}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.status === "pending" && (
                <>
                  <Dialog open={viewingDialog} onOpenChange={setViewingDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Calendar2 className="mr-2 h-4 w-4" />
                        Schedule Viewing
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Property Viewing</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="viewing-date">Proposed Viewing Date & Time</Label>
                          <Input
                            id="viewing-date"
                            type="datetime-local"
                            value={viewingDate}
                            onChange={(e) => setViewingDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="viewing-message">Message to Tenant (Optional)</Label>
                          <Textarea
                            id="viewing-message"
                            placeholder="Hi! I'd like to schedule a viewing. You can accept this time or suggest a different time."
                            value={viewingMessage}
                            onChange={(e) => setViewingMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setViewingDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={scheduleViewing} disabled={!viewingDate}>
                            Send Viewing Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Application
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Decline Application</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejection-reason">Reason for Declining</Label>
                          <Textarea
                            id="rejection-reason"
                            placeholder="Please provide a reason for declining this application..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setRejectionDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateApplicationStatus("rejected", rejectionReason)}
                            disabled={!rejectionReason.trim()}
                          >
                            Decline Application
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {(application.status === "viewing_declined" || application.status === "viewing_scheduled") && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateApplicationStatus("approved")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Application
                  </Button>
                  <Dialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Application
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Decline Application</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejection-reason">Reason for Declining</Label>
                          <Textarea
                            id="rejection-reason"
                            placeholder="Please provide a reason for declining this application..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setRejectionDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateApplicationStatus("rejected", rejectionReason)}
                            disabled={!rejectionReason.trim()}
                          >
                            Decline Application
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <Button variant="outline" className="w-full bg-transparent">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
