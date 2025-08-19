"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Search,
  MapPin,
  Coins,
  Calendar,
  Eye,
  User,
  CheckCircle,
  XCircle,
  CalendarPlus2Icon as Calendar2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { notifyApplicationApproved, notifyApplicationRejected } from "@/lib/notifications"

interface Application {
  id: string
  status:
    | "pending"
    | "viewing_requested"
    | "viewing_scheduled"
    | "viewing_accepted"
    | "viewing_declined"
    | "awaiting_landlord_decision"
    | "approved"
    | "rejected"
  applied_at: string
  proposed_move_in_date: string
  lease_duration_requested: number
  additional_occupants: number
  additional_occupants_details: string
  tenant_notes: string
  rejection_reason: string
  tenant_id: string
  property_id: string
  special_requests: string
  property: {
    id: string
    title: string
    address: string
    rent_amount: number
    landlord_id: string
    applications_count: number
    water_included: boolean
    electricity_included: boolean
    gas_included: boolean
    is_active: boolean
  }
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
  }
  viewing_request?: {
    id: string
    requested_date: string
    requested_time: string
    status: string
    tenant_message?: string
    landlord_response?: string
  }
}

export default function LandlordApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [viewingDialog, setViewingDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  })
  const [viewingDate, setViewingDate] = useState("")
  const [viewingMessage, setViewingMessage] = useState("")
  const [error, setError] = useState<string>("")
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean
    applicationId: string | null
    action: string | null
  }>({
    open: false,
    applicationId: null,
    action: null,
  })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  })

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        if (!profile?.id) return

        setLoading(true)

        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select(`
            id, status, applied_at, proposed_move_in_date, lease_duration_requested, 
            tenant_notes, rejection_reason, property_id, tenant_id, special_requests,
            additional_occupants, additional_occupants_details
          `)
          .order("applied_at", { ascending: false })

        if (applicationsError) throw applicationsError

        if (!applicationsData || applicationsData.length === 0) {
          setApplications([])
          return
        }

        // Get unique property IDs and filter by landlord
        const propertyIds = [...new Set(applicationsData.map((app) => app.property_id))]

        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select(
            "id, title, address, rent_amount, landlord_id, applications_count, water_included, electricity_included, gas_included, is_active",
          )
          .in("id", propertyIds)
          .eq("landlord_id", profile.id)

        if (propertiesError) throw propertiesError

        // Filter applications to only include landlord's properties
        const landlordApplications = applicationsData.filter((app) =>
          propertiesData?.some((prop) => prop.id === app.property_id),
        )

        // Get unique tenant IDs
        const tenantIds = [...new Set(landlordApplications.map((app) => app.tenant_id))]

        // Fetch tenant profiles separately
        const { data: tenantProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone")
          .in("id", tenantIds)

        if (profilesError) throw profilesError

        const { data: viewingRequests, error: viewingError } = await supabase
          .from("viewing_requests")
          .select(
            "id, property_id, tenant_id, requested_date, requested_time, status, tenant_message, landlord_response",
          )
          .in("property_id", propertiesData?.map((prop) => prop.id) || [])
          .in("tenant_id", tenantIds)

        if (viewingError) throw viewingError

        const combinedApplications = landlordApplications.map((app) => ({
          ...app,
          property: propertiesData?.find((prop) => prop.id === app.property_id) || {
            id: app.property_id,
            title: "Unknown Property",
            address: "Unknown Address",
            rent_amount: 0,
            landlord_id: profile.id,
            applications_count: 0,
            water_included: false,
            electricity_included: false,
            gas_included: false,
            is_active: true,
          },
          tenant: tenantProfiles?.find((profile) => profile.id === app.tenant_id) || {
            id: app.tenant_id,
            first_name: "Unknown",
            last_name: "Tenant",
            email: "No email",
            phone: null,
          },
          viewing_request:
            viewingRequests?.find((vr) => vr.property_id === app.property_id && vr.tenant_id === app.tenant_id) || null,
        }))

        setApplications(combinedApplications)
      } catch (error) {
        console.error("Error fetching applications:", error)
        setError("Failed to load applications")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [profile?.id])

  const scheduleViewing = async () => {
    if (!viewingDialog.applicationId || !viewingDate) return

    try {
      const application = applications.find((app) => app.id === viewingDialog.applicationId)
      if (!application) return

      const { error: viewingError } = await supabase.from("viewing_requests").insert({
        property_id: application.property.id,
        tenant_id: application.tenant_id,
        requested_date: viewingDate.split("T")[0],
        requested_time: viewingDate.split("T")[1] || "10:00",
        status: "requested",
        tenant_message:
          viewingMessage ||
          `Hi! I'd like to schedule a viewing for ${new Date(viewingDate).toLocaleDateString()} at ${new Date(viewingDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. You can accept this time or let me know if you prefer a different time. If you're happy with the photos and don't need to view the property, just let me know and we can proceed with your application.`,
      })

      if (viewingError) throw viewingError

      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "viewing_requested" })
        .eq("id", viewingDialog.applicationId)

      if (appError) throw appError

      // Send viewing request message to tenant
      const { error: messageError } = await supabase.from("messages").insert({
        sender_id: profile?.id,
        recipient_id: application.tenant_id,
        property_id: application.property.id,
        subject: "Viewing Request for Your Application",
        message: `I'd like to schedule a viewing for ${application.property.title} on ${new Date(viewingDate).toLocaleDateString()} at ${new Date(viewingDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Please let me know if this time works for you, or suggest an alternative time. If you're satisfied with the photos and don't need a viewing, we can proceed directly with your application.`,
        message_type: "viewing",
        requires_response: true,
      })

      if (messageError) {
        console.error("Error sending viewing message:", messageError)
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === viewingDialog.applicationId ? { ...app, status: "viewing_requested" as const } : app,
        ),
      )

      setViewingDialog({ open: false, applicationId: null })
      setViewingDate("")
      setViewingMessage("")
    } catch (error) {
      console.error("Error scheduling viewing:", error)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: "approved" | "rejected", reason?: string) => {
    try {
      const updateData: any = { status }
      if (reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase.from("applications").update(updateData).eq("id", applicationId)

      if (error) throw error

      if (status === "approved") {
        const application = applications.find((app) => app.id === applicationId)
        if (application) {
          console.log("Creating lease for approved application:", applicationId)

          const leaseEndDate = new Date(application.proposed_move_in_date)
          leaseEndDate.setMonth(leaseEndDate.getMonth() + (application.lease_duration_requested || 12))

          const { data: leaseData, error: leaseError } = await supabase
            .from("leases")
            .insert({
              application_id: applicationId,
              property_id: application.property.id,
              tenant_id: application.tenant_id,
              landlord_id: profile?.id,
              monthly_rent: application.property.rent_amount,
              start_date: application.proposed_move_in_date,
              end_date: leaseEndDate.toISOString().split("T")[0],
              deposit_amount: application.property.rent_amount,
              is_active: true,
              signed_by_landlord: true,
              signed_by_tenant: false,
              lease_terms: "Standard lease agreement terms apply.",
              utilities_included:
                application.property.water_included ||
                application.property.electricity_included ||
                application.property.gas_included,
            })
            .select()
            .single()

          if (leaseError) {
            console.error("Error creating lease:", leaseError)
            alert(`Failed to create lease: ${leaseError.message}`)
            throw leaseError
          }

          console.log("Lease created successfully:", leaseData)

          const { data: messageData, error: messageError } = await supabase
            .from("messages")
            .insert({
              sender_id: profile?.id,
              recipient_id: application.tenant_id,
              property_id: application.property.id,
              subject: "Application Approved - Welcome to Your New Home!",
              message: `Congratulations! Your application for ${application.property.title} has been approved. 

Your lease details:
- Property: ${application.property.title}
- Monthly Rent: R${application.property.rent_amount.toLocaleString()}
- Move-in Date: ${new Date(application.proposed_move_in_date).toLocaleDateString()}
- Lease Duration: ${application.lease_duration_requested || 12} months

Please contact me to arrange key collection and move-in details. Welcome to your new home!

Best regards,
${profile?.first_name} ${profile?.last_name}`,
              message_type: "lease",
              is_read: false,
            })
            .select()
            .single()

          if (messageError) {
            console.error("Error sending approval message:", messageError)
            alert(`Lease created but failed to send message: ${messageError.message}`)
          } else {
            console.log("Approval message sent successfully:", messageData)
          }

          await supabase.from("notifications").insert({
            user_id: application.tenant_id,
            type: "application",
            title: "Application Approved!",
            message: `Your application for ${application.property.title} has been approved. Welcome to your new home!`,
            action_url: `/tenant/applications/${applicationId}`,
          })

          try {
            await notifyApplicationApproved(application.tenant_id, application.property.title, applicationId)
          } catch (notificationError) {
            console.error("Error sending approval notification:", notificationError)
          }

          const { error: propertyError } = await supabase
            .from("properties")
            .update({
              status: "occupied",
              is_active: false,
              applications_count: Math.max(0, (application.property.applications_count || 1) - 1),
            })
            .eq("id", application.property.id)

          if (propertyError) {
            console.error("Error updating property status:", propertyError)
          }

          const { error: rejectOthersError } = await supabase
            .from("applications")
            .update({
              status: "rejected",
              rejection_reason: "Property has been rented to another applicant",
            })
            .eq("property_id", application.property.id)
            .neq("id", applicationId)
            .in("status", [
              "pending",
              "viewing_requested",
              "viewing_scheduled",
              "viewing_declined",
              "viewing_accepted",
              "awaiting_landlord_decision",
            ])

          if (rejectOthersError) {
            console.error("Error rejecting other applications:", rejectOthersError)
          }

          const otherApplications = applications.filter(
            (app) =>
              app.property.id === application.property.id &&
              app.id !== applicationId &&
              [
                "pending",
                "viewing_requested",
                "viewing_scheduled",
                "viewing_declined",
                "viewing_accepted",
                "awaiting_landlord_decision",
              ].includes(app.status),
          )

          for (const otherApp of otherApplications) {
            await supabase.from("messages").insert({
              sender_id: profile?.id,
              recipient_id: otherApp.tenant_id,
              property_id: application.property.id,
              subject: "Application Update",
              message: `Thank you for your interest in ${application.property.title}. Unfortunately, we have decided to proceed with another applicant and the property is no longer available. We wish you the best in finding your new home.`,
              message_type: "general",
              is_read: false,
            })

            await supabase.from("notifications").insert({
              user_id: otherApp.tenant_id,
              type: "application",
              title: "Application Update",
              message: `Your application for ${application.property.title} was not successful. The property has been rented to another applicant.`,
              action_url: `/tenant/applications/${otherApp.id}`,
            })

            try {
              await notifyApplicationRejected(otherApp.tenant_id, application.property.title, otherApp.id)
            } catch (notificationError) {
              console.error("Error sending rejection notification:", notificationError)
            }
          }

          alert(`Application approved successfully! Lease created, tenant notified, and property deactivated.`)
        }
      } else if (status === "rejected" && reason) {
        const application = applications.find((app) => app.id === applicationId)
        if (application) {
          const { error: messageError } = await supabase.from("messages").insert({
            sender_id: profile?.id,
            recipient_id: application.tenant_id,
            property_id: application.property.id,
            subject: "Application Update",
            message: `Thank you for your interest in ${application.property.title}. Unfortunately, we have decided to proceed with another applicant. ${reason ? `Reason: ${reason}` : ""} We wish you the best in finding your new home.`,
            message_type: "general",
            is_read: false,
          })

          if (messageError) {
            console.error("Error sending rejection message:", messageError)
          }

          await supabase.from("notifications").insert({
            user_id: application.tenant_id,
            type: "application",
            title: "Application Update",
            message: `Your application for ${application.property.title} was not successful.`,
            action_url: `/tenant/applications/${applicationId}`,
          })

          try {
            await notifyApplicationRejected(application.tenant_id, application.property.title, applicationId)
          } catch (notificationError) {
            console.error("Error sending rejection notification:", notificationError)
          }
        }
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: status as const } : app)),
      )

      setApprovalDialog({ open: false, applicationId: null, action: null })
      setRejectionDialog({ open: false, applicationId: null })
    } catch (error) {
      console.error("Error updating application status:", error)
      alert(`Failed to update application: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const filteredApplications = applications.filter((application) => {
    if (!application.tenant) return false

    const matchesSearch =
      application.tenant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.tenant.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.property.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || application.status === statusFilter
    const matchesProperty = propertyFilter === "all" || application.property.id === propertyFilter

    return matchesSearch && matchesStatus && matchesProperty
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "viewing_requested":
        return "bg-blue-100 text-blue-800"
      case "viewing_scheduled":
        return "bg-purple-100 text-purple-800"
      case "viewing_accepted":
        return "bg-green-100 text-green-800"
      case "viewing_declined":
        return "bg-orange-100 text-orange-800"
      case "awaiting_landlord_decision":
        return "bg-gray-100 text-gray-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "New Application"
      case "viewing_requested":
        return "Viewing Requested"
      case "viewing_scheduled":
        return "Viewing Scheduled"
      case "viewing_accepted":
        return "Viewing Accepted"
      case "viewing_declined":
        return "Ready for Approval"
      case "awaiting_landlord_decision":
        return "Awaiting Your Decision"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-gray-600">Review and manage rental applications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{applications.filter((app) => app.status === "pending").length} New</Badge>
          <Badge variant="outline">{applications.length} Total</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">New Applications</SelectItem>
                <SelectItem value="viewing_requested">Viewing Requested</SelectItem>
                <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                <SelectItem value="viewing_accepted">Viewing Accepted</SelectItem>
                <SelectItem value="viewing_declined">Ready for Approval</SelectItem>
                <SelectItem value="awaiting_landlord_decision">Awaiting Your Decision</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {Array.from(new Set(applications.map((app) => app.property?.id)))
                  .filter(Boolean)
                  .map((propertyId, index) => {
                    const property = applications.find((app) => app.property?.id === propertyId)?.property
                    return (
                      <SelectItem key={`property-${propertyId}-${index}`} value={propertyId}>
                        {property?.title || "Unknown Property"}
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application, index) => (
            <Card key={`${application.id}-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {application.tenant?.first_name?.[0] || "T"}
                        {application.tenant?.last_name?.[0] || "U"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {application.tenant?.first_name || "Unknown"} {application.tenant?.last_name || "User"}
                      </h3>
                      <p className="text-sm text-gray-600">{application.tenant?.email || "No email"}</p>
                      {application.tenant?.phone && <p className="text-sm text-gray-600">{application.tenant.phone}</p>}
                    </div>
                  </div>
                  <Badge className={getStatusColor(application.status)}>{getStatusText(application.status)}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-medium">{application.property.title}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {application.property.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="font-medium flex items-center">
                      <Coins className="h-4 w-4 mr-1" />R{application.property.rent_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Move-in Date</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(application.proposed_move_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lease Period</p>
                    <p className="font-medium">{application.lease_duration_requested} months</p>
                  </div>
                </div>

                {application.additional_occupants > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Additional People</p>
                    <p className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {application.additional_occupants} additional{" "}
                      {application.additional_occupants === 1 ? "person" : "people"}
                    </p>
                    {application.additional_occupants_details && (
                      <p className="text-sm text-gray-600 mt-2">{application.additional_occupants_details}</p>
                    )}
                  </div>
                )}

                {application.viewing_request && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1 flex items-center">
                      <Calendar2 className="h-4 w-4 mr-1" />
                      Viewing Requested:
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        application.viewing_request.requested_date + "T" + application.viewing_request.requested_time,
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        application.viewing_request.requested_date + "T" + application.viewing_request.requested_time,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {application.viewing_request.tenant_message && (
                      <p className="text-sm text-gray-600 mt-2">{application.viewing_request.tenant_message}</p>
                    )}
                  </div>
                )}

                {application.tenant_notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Message from applicant:</p>
                    <p className="text-sm">{application.tenant_notes}</p>
                  </div>
                )}

                {application.special_requests && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Special Requests:</p>
                    <p className="text-sm">{application.special_requests}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Applied {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Link href={`/landlord/applications/${application.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>

                    {(application.status === "viewing_declined" ||
                      application.status === "viewing_scheduled" ||
                      application.status === "viewing_accepted" ||
                      application.status === "awaiting_landlord_decision" ||
                      application.status === "pending") && (
                      <>
                        {application.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                            onClick={() => setViewingDialog({ open: true, applicationId: application.id })}
                          >
                            <Calendar2 className="mr-2 h-4 w-4" />
                            Request Viewing
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          onClick={() => setRejectionDialog({ open: true, applicationId: application.id })}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            setApprovalDialog({ open: true, applicationId: application.id, action: "approve" })
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {application.status === "viewing_scheduled" || application.status === "viewing_accepted"
                            ? "Approve After Viewing"
                            : application.status === "awaiting_landlord_decision"
                              ? "Approve Without Viewing"
                              : "Approve Application"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || propertyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Applications will appear here when people apply for your properties"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ open, applicationId: null, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Important:</strong> Approving this application will:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                <li>• Create an active lease for the tenant</li>
                <li>• Move the tenant to your "Tenants" dashboard</li>
                <li>• Deactivate the property (no longer available)</li>
                <li>• Automatically reject all other applications for this property</li>
                <li>• Send notifications to all affected applicants</li>
              </ul>
            </div>
            <p>Are you sure you want to approve this application?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setApprovalDialog({ open: false, applicationId: null, action: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateApplicationStatus(approvalDialog.applicationId!, "approved")}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve & Create Lease
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ open, applicationId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Enter a reason for declining this application:</p>
            <Textarea
              placeholder="Reason for rejection..."
              onChange={(e) => setViewingMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRejectionDialog({ open: false, applicationId: null })}>
                Cancel
              </Button>
              <Button
                onClick={() => updateApplicationStatus(rejectionDialog.applicationId!, "rejected", viewingMessage)}
              >
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewing Request Dialog */}
      <Dialog open={viewingDialog.open} onOpenChange={(open) => setViewingDialog({ open, applicationId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Viewing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Proposed Date & Time</label>
              <Input
                type="datetime-local"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message to Tenant (Optional)</label>
              <Textarea
                placeholder="Additional message about the viewing..."
                value={viewingMessage}
                onChange={(e) => setViewingMessage(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setViewingDialog({ open: false, applicationId: null })}>
                Cancel
              </Button>
              <Button onClick={scheduleViewing} disabled={!viewingDate}>
                Send Viewing Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
