"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Clock,
  Home,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { notifyApplicationApproved, notifyApplicationRejected } from "@/lib/notifications"

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "pending"
  | "viewing_requested"
  | "viewing_scheduled"
  | "viewing_accepted"
  | "viewing_declined"
  | "awaiting_landlord_decision"
  | "approved"
  | "rejected"

type ViewingStatus =
  | "requested"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "application_submitted"
  | "declined"
  | "pending"

interface Application {
  id: string
  status: ApplicationStatus
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
    status: ViewingStatus
    tenant_message?: string
    landlord_message?: string  // ✅ FIXED: was landlord_response
  } | null
}

interface StandaloneViewing {
  id: string
  property_id: string
  tenant_id: string
  requested_date: string
  requested_time: string
  status: ViewingStatus
  tenant_message: string | null
  landlord_message: string | null  // ✅ FIXED: was landlord_response
  created_at: string
  property: {
    id: string
    title: string
    address: string
  }
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getViewingStatusColor(status: ViewingStatus): string {
  switch (status) {
    case "pending":
    case "requested":
      return "bg-yellow-100 text-yellow-800"
    case "scheduled":
      return "bg-blue-100 text-blue-800"
    case "confirmed":
      return "bg-green-100 text-green-800"
    case "completed":
      return "bg-blue-100 text-blue-800"
    case "application_submitted":
      return "bg-purple-100 text-purple-800"
    case "declined":
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getViewingStatusText(status: ViewingStatus): string {
  switch (status) {
    case "pending":
    case "requested":
      return "Awaiting Confirmation"
    case "scheduled":
      return "Scheduled"
    case "confirmed":
      return "Confirmed"
    case "completed":
      return "Completed"
    case "application_submitted":
      return "Application Submitted"
    case "declined":
      return "Declined"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

function getAppStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800"
    case "viewing_requested": return "bg-blue-100 text-blue-800"
    case "viewing_scheduled": return "bg-purple-100 text-purple-800"
    case "viewing_accepted": return "bg-green-100 text-green-800"
    case "viewing_declined": return "bg-orange-100 text-orange-800"
    case "awaiting_landlord_decision": return "bg-gray-100 text-gray-800"
    case "approved": return "bg-green-100 text-green-800"
    case "rejected": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

function getAppStatusText(status: ApplicationStatus): string {
  switch (status) {
    case "pending": return "New Application"
    case "viewing_requested": return "Viewing Requested"
    case "viewing_scheduled": return "Viewing Scheduled"
    case "viewing_accepted": return "Viewing Accepted"
    case "viewing_declined": return "Ready for Approval"
    case "awaiting_landlord_decision": return "Awaiting Your Decision"
    case "approved": return "Approved"
    case "rejected": return "Rejected"
    default: return status
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandlordApplicationsPage() {
  const { profile } = useAuth()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState<Application[]>([])
  const [standaloneViewings, setStandaloneViewings] = useState<StandaloneViewing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [viewingDialog, setViewingDialog] = useState<{
    open: boolean
    applicationId: string | null
  }>({ open: false, applicationId: null })
  const [viewingDate, setViewingDate] = useState("")
  const [viewingMessage, setViewingMessage] = useState("")

  const [confirmViewingDialog, setConfirmViewingDialog] = useState<{
    open: boolean
    viewingId: string | null
    context: "standalone" | "application"
    applicationId: string | null
  }>({ open: false, viewingId: null, context: "standalone", applicationId: null })
  const [confirmViewingNote, setConfirmViewingNote] = useState("")
  const [confirmingViewing, setConfirmingViewing] = useState(false)

  const [declineViewingDialog, setDeclineViewingDialog] = useState<{
    open: boolean
    viewingId: string | null
  }>({ open: false, viewingId: null })
  const [declineViewingNote, setDeclineViewingNote] = useState("")

  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean
    applicationId: string | null
    action: string | null
  }>({ open: false, applicationId: null, action: null })

  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean
    applicationId: string | null
  }>({ open: false, applicationId: null })
  const [rejectionReason, setRejectionReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // ─── Fetch All Data ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!profile?.id) return
    try {
      setLoading(true)

      // 1. Get all landlord property IDs
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select(
          "id, title, address, rent_amount, landlord_id, applications_count, water_included, electricity_included, gas_included, is_active"
        )
        .eq("landlord_id", profile.id)

      if (propertiesError) throw propertiesError
      if (!propertiesData || propertiesData.length === 0) {
        setApplications([])
        setStandaloneViewings([])
        return
      }

      const propertyIds = propertiesData.map((p) => p.id)

      // 2. Fetch applications + viewing_requests in parallel
      const [applicationsResult, viewingResult] = await Promise.all([
        supabase
          .from("applications")
          .select(`
            id, status, applied_at, proposed_move_in_date, lease_duration_requested,
            tenant_notes, rejection_reason, property_id, tenant_id, special_requests,
            additional_occupants, additional_occupants_details
          `)
          .in("property_id", propertyIds)
          .order("applied_at", { ascending: false }),

        supabase
          .from("viewing_requests")
          .select(
            // ✅ FIXED: landlord_message instead of landlord_response
            "id, property_id, tenant_id, requested_date, requested_time, status, tenant_message, landlord_message, created_at"
          )
          .in("property_id", propertyIds),
      ])

      if (applicationsResult.error) throw applicationsResult.error
      if (viewingResult.error) throw viewingResult.error

      const applicationsData = applicationsResult.data || []
      const viewingRequestsData = viewingResult.data || []

      // 3. Get all unique tenant IDs
      const tenantIds = [
        ...new Set([
          ...applicationsData.map((a) => a.tenant_id),
          ...viewingRequestsData.map((v) => v.tenant_id),
        ]),
      ]

      const { data: tenantProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", tenantIds)

      if (profilesError) throw profilesError

      // 4. Build applications with joined data
      // ✅ FIXED: Sort viewings by created_at desc and take latest match
      const combined: Application[] = applicationsData.map((app) => {
        const matchingViewings = viewingRequestsData
          .filter(
            (vr) =>
              vr.property_id === app.property_id &&
              vr.tenant_id === app.tenant_id
          )
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )

        return {
          ...app,
          status: app.status as ApplicationStatus,
          property: propertiesData.find((p) => p.id === app.property_id) ?? {
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
          tenant: tenantProfiles?.find((t) => t.id === app.tenant_id) ?? {
            id: app.tenant_id,
            first_name: "Unknown",
            last_name: "Tenant",
            email: "No email",
            phone: null,
          },
          // ✅ FIXED: Use latest viewing request instead of first match
          viewing_request: matchingViewings[0] ?? null,
        }
      })

      setApplications(combined)

      // 5. Standalone viewings = viewing requests with NO matching application
      const applicationTenantPropertyPairs = new Set(
        applicationsData.map((a) => `${a.property_id}__${a.tenant_id}`)
      )

      const standalone: StandaloneViewing[] = viewingRequestsData
        .filter(
          (vr) =>
            !applicationTenantPropertyPairs.has(`${vr.property_id}__${vr.tenant_id}`)
        )
        .map((vr) => ({
          ...vr,
          status: vr.status as ViewingStatus,
          // ✅ landlord_message is now correctly in the select
          landlord_message: vr.landlord_message ?? null,
          property: propertiesData.find((p) => p.id === vr.property_id) ?? {
            id: vr.property_id,
            title: "Unknown Property",
            address: "Unknown Address",
          },
          tenant: tenantProfiles?.find((t) => t.id === vr.tenant_id) ?? {
            id: vr.tenant_id,
            first_name: "Unknown",
            last_name: "Tenant",
            email: "No email",
            phone: null,
          },
        }))

      setStandaloneViewings(standalone)
    } catch (err) {
      console.error("[fetchData]", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Confirm Viewing ──────────────────────────────────────────────────────

  const handleConfirmViewing = async () => {
    if (!confirmViewingDialog.viewingId) return
    setConfirmingViewing(true)
    try {
      const { error } = await supabase
        .from("viewing_requests")
        .update({
          status: "confirmed",
          landlord_message: confirmViewingNote.trim() || null, // ✅ FIXED
        })
        .eq("id", confirmViewingDialog.viewingId)

      if (error) throw error

      await fetchData()
      setConfirmViewingDialog({
        open: false,
        viewingId: null,
        context: "standalone",
        applicationId: null,
      })
      setConfirmViewingNote("")
    } catch (err) {
      console.error("[confirmViewing]", err)
    } finally {
      setConfirmingViewing(false)
    }
  }

  // ─── Mark Viewing as Completed ────────────────────────────────────────────

  const handleMarkViewingDone = async (
    viewingId: string,
    applicationId: string | null
  ) => {
    setConfirmingViewing(true)
    try {
      const { error } = await supabase
        .from("viewing_requests")
        .update({ status: "completed" })
        .eq("id", viewingId)

      if (error) throw error

      if (applicationId) {
        await supabase
          .from("applications")
          .update({ status: "awaiting_landlord_decision" })
          .eq("id", applicationId)
      }

      await fetchData()
    } catch (err) {
      console.error("[markViewingDone]", err)
    } finally {
      setConfirmingViewing(false)
    }
  }

  // ─── Decline Viewing ──────────────────────────────────────────────────────

  const handleDeclineViewing = async () => {
    if (!declineViewingDialog.viewingId) return
    try {
      const { error } = await supabase
        .from("viewing_requests")
        .update({
          status: "declined",
          landlord_message: declineViewingNote.trim() || null, // ✅ FIXED
        })
        .eq("id", declineViewingDialog.viewingId)

      if (error) throw error

      await fetchData()
      setDeclineViewingDialog({ open: false, viewingId: null })
      setDeclineViewingNote("")
    } catch (err) {
      console.error("[declineViewing]", err)
    }
  }

  // ─── Schedule Viewing ─────────────────────────────────────────────────────

  const scheduleViewing = async () => {
    if (!viewingDialog.applicationId || !viewingDate) return
    try {
      const application = applications.find(
        (app) => app.id === viewingDialog.applicationId
      )
      if (!application) return

      const { error: viewingError } = await supabase
        .from("viewing_requests")
        .insert({
          property_id: application.property.id,
          tenant_id: application.tenant_id,
          requested_date: viewingDate.split("T")[0],
          requested_time: viewingDate.split("T")[1] || "10:00",
          status: "confirmed",
          landlord_message: viewingMessage || null, // ✅ FIXED
        })
      if (viewingError) throw viewingError

      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "viewing_scheduled" })
        .eq("id", viewingDialog.applicationId)
      if (appError) throw appError

      await fetchData()
      setViewingDialog({ open: false, applicationId: null })
      setViewingDate("")
      setViewingMessage("")
    } catch (err) {
      console.error("[scheduleViewing]", err)
    }
  }

  // ─── Approve / Reject Application ────────────────────────────────────────

  const updateApplicationStatus = async (
    applicationId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    setSubmitting(true)
    try {
      const updateData: Record<string, unknown> = { status }
      if (reason) updateData.rejection_reason = reason

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId)
      if (error) throw error

      if (status === "approved") {
        const application = applications.find((app) => app.id === applicationId)
        if (application) {
          const leaseEndDate = new Date(application.proposed_move_in_date)
          leaseEndDate.setMonth(
            leaseEndDate.getMonth() + (application.lease_duration_requested || 12)
          )

          const { error: leaseError } = await supabase.from("leases").insert({
            application_id: applicationId,
            property_id: application.property.id,
            tenant_id: application.tenant_id,
            landlord_id: profile?.id,
            monthly_rent: application.property.rent_amount,
            start_date: application.proposed_move_in_date,
            end_date: leaseEndDate.toISOString().split("T")[0],
            deposit_amount: application.property.rent_amount,
            is_active: true,
            signed_by_landlord: false,
            signed_by_tenant: false,
            lease_terms: "Standard lease agreement terms apply.",
            utilities_included:
              application.property.water_included ||
              application.property.electricity_included ||
              application.property.gas_included,
          })
          if (leaseError) throw leaseError

          await supabase.from("notifications").insert({
            user_id: application.tenant_id,
            type: "application",
            title: "Application Approved!",
            message: `Your application for ${application.property.title} has been approved. Please sign your lease.`,
            action_url: `/tenant/leases`,
          })

          try {
            await notifyApplicationApproved(
              application.tenant_id,
              application.property.title,
              applicationId
            )
          } catch (err) {
            console.error("Notification error:", err)
          }

          await supabase
            .from("properties")
            .update({ status: "occupied", is_active: false })
            .eq("id", application.property.id)

          await supabase
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
              "viewing_accepted",
              "awaiting_landlord_decision",
            ])
        }
      } else if (status === "rejected") {
        const application = applications.find((app) => app.id === applicationId)
        if (application) {
          await supabase.from("notifications").insert({
            user_id: application.tenant_id,
            type: "application",
            title: "Application Update",
            message: `Your application for ${application.property.title} was not successful.`,
            action_url: `/tenant/applications/${applicationId}`,
          })
          try {
            await notifyApplicationRejected(
              application.tenant_id,
              application.property.title,
              applicationId
            )
          } catch (err) {
            console.error("Notification error:", err)
          }
        }
      }

      await fetchData()
      setApprovalDialog({ open: false, applicationId: null, action: null })
      setRejectionDialog({ open: false, applicationId: null })
      setRejectionReason("")
    } catch (err) {
      console.error("[updateApplicationStatus]", err)
      alert(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  const filteredApplications = applications.filter((app) => {
    if (!app.tenant) return false
    const matchesSearch =
      app.tenant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tenant.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.property.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter
    const matchesProperty =
      propertyFilter === "all" || app.property.id === propertyFilter
    return matchesSearch && matchesStatus && matchesProperty
  })

  const pendingViewings = standaloneViewings.filter(
    (v) => v.status === "pending" || v.status === "requested"
  )
  const confirmedViewings = standaloneViewings.filter(
    (v) => v.status === "confirmed" || v.status === "scheduled"
  )

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications & Viewings</h2>
          <p className="text-gray-600">Manage viewing requests and rental applications</p>
        </div>
        <div className="flex items-center space-x-2">
          {pendingViewings.length > 0 && (
            <Badge className="bg-orange-100 text-orange-800">
              {pendingViewings.length} Viewing{pendingViewings.length !== 1 ? "s" : ""} Pending
            </Badge>
          )}
          <Badge variant="secondary">
            {applications.filter((app) => app.status === "pending").length} New Apps
          </Badge>
          <Badge variant="outline">{applications.length} Total</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="applications">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="viewings">
            Viewing Requests ({standaloneViewings.length})
            {pendingViewings.length > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                {pendingViewings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── APPLICATIONS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="applications" className="space-y-4 mt-4">

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">New Applications</SelectItem>
                    <SelectItem value="viewing_requested">Viewing Requested</SelectItem>
                    <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                    <SelectItem value="awaiting_landlord_decision">Awaiting Decision</SelectItem>
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
                    {[...new Set(applications.map((a) => a.property.id))].map((pid) => {
                      const prop = applications.find((a) => a.property.id === pid)?.property
                      return (
                        <SelectItem key={pid} value={pid}>
                          {prop?.title ?? "Unknown"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No applications found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" || propertyFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Applications will appear here when tenants apply for your properties"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card
                key={application.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">

                  {/* Tenant header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-white">
                          {application.tenant?.first_name?.[0] ?? "T"}
                          {application.tenant?.last_name?.[0] ?? "U"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {application.tenant?.first_name ?? "Unknown"}{" "}
                          {application.tenant?.last_name ?? "Tenant"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.tenant?.email ?? "No email"}
                        </p>
                        {application.tenant?.phone && (
                          <p className="text-sm text-gray-600">
                            {application.tenant.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getAppStatusColor(application.status)}>
                      {getAppStatusText(application.status)}
                    </Badge>
                  </div>

                  {/* Property details grid */}
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
                        <Coins className="h-4 w-4 mr-1" />
                        R{application.property.rent_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Move-in Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(
                          application.proposed_move_in_date + "T00:00:00"
                        ).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lease Period</p>
                      <p className="font-medium">
                        {application.lease_duration_requested} months
                      </p>
                    </div>
                  </div>

                  {/* Additional occupants */}
                  {application.additional_occupants > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Additional People</p>
                      <p className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {application.additional_occupants} additional{" "}
                        {application.additional_occupants === 1 ? "person" : "people"}
                      </p>
                      {application.additional_occupants_details && (
                        <p className="text-sm text-gray-500 mt-1">
                          {application.additional_occupants_details}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Viewing request status on application */}
                  {application.viewing_request && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-700 flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          Viewing Request
                        </p>
                        <Badge
                          className={getViewingStatusColor(
                            application.viewing_request.status
                          )}
                        >
                          {getViewingStatusText(application.viewing_request.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {new Date(
                          application.viewing_request.requested_date + "T00:00:00"
                        ).toLocaleDateString("en-ZA", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        at {application.viewing_request.requested_time}
                      </p>
                      {application.viewing_request.tenant_message && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          "{application.viewing_request.tenant_message}"
                        </p>
                      )}

                      {/* Confirm viewing buttons */}
                      {(application.viewing_request.status === "pending" ||
                        application.viewing_request.status === "requested") && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs"
                            onClick={() =>
                              setConfirmViewingDialog({
                                open: true,
                                viewingId: application.viewing_request!.id,
                                context: "application",
                                applicationId: application.id,
                              })
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirm Viewing
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            onClick={() =>
                              setDeclineViewingDialog({
                                open: true,
                                viewingId: application.viewing_request!.id,
                              })
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Decline Viewing
                          </Button>
                        </div>
                      )}

                      {/* Mark as Done button */}
                      {application.viewing_request.status === "confirmed" && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                            disabled={confirmingViewing}
                            onClick={() =>
                              handleMarkViewingDone(
                                application.viewing_request!.id,
                                application.id
                              )
                            }
                          >
                            {confirmingViewing ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Confirm Viewing Was Done
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">
                            Click after the physical viewing has taken place
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {application.tenant_notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">
                        Message from applicant:
                      </p>
                      <p className="text-sm">{application.tenant_notes}</p>
                    </div>
                  )}
                  {application.special_requests && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Special Requests:</p>
                      <p className="text-sm">{application.special_requests}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-gray-500">
                      Applied{" "}
                      {new Date(application.applied_at).toLocaleDateString("en-ZA")}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Link href={`/landlord/applications/${application.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>

                      {!["approved", "rejected"].includes(application.status) && (
                        <>
                          {application.status === "pending" &&
                            !application.viewing_request && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() =>
                                  setViewingDialog({
                                    open: true,
                                    applicationId: application.id,
                                  })
                                }
                              >
                                <Calendar2 className="mr-2 h-4 w-4" />
                                Schedule Viewing
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() =>
                              setRejectionDialog({
                                open: true,
                                applicationId: application.id,
                              })
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              setApprovalDialog({
                                open: true,
                                applicationId: application.id,
                                action: "approve",
                              })
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Application
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── VIEWINGS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="viewings" className="space-y-4 mt-4">

          {standaloneViewings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No viewing requests
                </h3>
                <p className="text-gray-600">
                  Viewing requests from tenants who haven't applied yet will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending confirmations */}
              {pendingViewings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Awaiting Your Confirmation ({pendingViewings.length})
                  </h3>
                  {pendingViewings.map((viewing) => (
                    <Card key={viewing.id} className="border-orange-200">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium text-orange-700">
                                {viewing.tenant.first_name?.[0] ?? "T"}
                                {viewing.tenant.last_name?.[0] ?? "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {viewing.tenant.first_name} {viewing.tenant.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {viewing.tenant.email}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Awaiting Confirmation
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Home className="h-4 w-4 shrink-0" />
                            <span className="font-medium">{viewing.property.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {new Date(
                                viewing.requested_date + "T00:00:00"
                              ).toLocaleDateString("en-ZA", {
                                weekday: "short",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}{" "}
                              at {viewing.requested_time}
                            </span>
                          </div>
                        </div>

                        {viewing.tenant_message && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600 italic">
                            "{viewing.tenant_message}"
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              setConfirmViewingDialog({
                                open: true,
                                viewingId: viewing.id,
                                context: "standalone",
                                applicationId: null,
                              })
                            }
                          >
                            <CheckCircle className="mr-2 h-3 w-3" />
                            Confirm This Time
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() =>
                              setDeclineViewingDialog({
                                open: true,
                                viewingId: viewing.id,
                              })
                            }
                          >
                            <XCircle className="mr-2 h-3 w-3" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Confirmed viewings awaiting completion */}
              {confirmedViewings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Confirmed — Mark as Done When Complete ({confirmedViewings.length})
                  </h3>
                  {confirmedViewings.map((viewing) => (
                    <Card key={viewing.id} className="border-green-200">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium text-green-700">
                                {viewing.tenant.first_name?.[0] ?? "T"}
                                {viewing.tenant.last_name?.[0] ?? "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {viewing.tenant.first_name} {viewing.tenant.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {viewing.tenant.email}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Home className="h-4 w-4 shrink-0" />
                            <span className="font-medium">{viewing.property.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {new Date(
                                viewing.requested_date + "T00:00:00"
                              ).toLocaleDateString("en-ZA", {
                                weekday: "short",
                                day: "numeric",
                                month: "long",
                              })}{" "}
                              at {viewing.requested_time}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={confirmingViewing}
                            onClick={() => handleMarkViewingDone(viewing.id, null)}
                          >
                            {confirmingViewing ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-3 w-3" />
                            )}
                            Confirm Viewing Was Done
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">
                            Tenant will be prompted to submit their application
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Other statuses */}
              {standaloneViewings
                .filter(
                  (v) =>
                    v.status !== "pending" &&
                    v.status !== "requested" &&
                    v.status !== "confirmed" &&
                    v.status !== "scheduled"
                )
                .map((viewing) => (
                  <Card key={viewing.id} className="opacity-75">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {viewing.tenant.first_name} {viewing.tenant.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {viewing.property.title} •{" "}
                            {new Date(
                              viewing.requested_date + "T00:00:00"
                            ).toLocaleDateString("en-ZA")}
                          </p>
                        </div>
                        <Badge className={getViewingStatusColor(viewing.status)}>
                          {getViewingStatusText(viewing.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Confirm Viewing Dialog ────────────────────────────────────────── */}
      <Dialog
        open={confirmViewingDialog.open}
        onOpenChange={(open) =>
          setConfirmViewingDialog({
            open,
            viewingId: null,
            context: "standalone",
            applicationId: null,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Viewing Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Confirming this viewing will notify the tenant that the appointment is set.
              The tenant will be able to submit a full application once the viewing is
              completed.
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message to Tenant (optional)
              </label>
              <Textarea
                placeholder="e.g., Looking forward to seeing you! Please ring the bell at the gate."
                value={confirmViewingNote}
                onChange={(e) => setConfirmViewingNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmViewingDialog({
                    open: false,
                    viewingId: null,
                    context: "standalone",
                    applicationId: null,
                  })
                }
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={confirmingViewing}
                onClick={handleConfirmViewing}
              >
                {confirmingViewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirm Viewing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Decline Viewing Dialog ────────────────────────────────────────── */}
      <Dialog
        open={declineViewingDialog.open}
        onOpenChange={(open) =>
          setDeclineViewingDialog({ open, viewingId: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Viewing Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The tenant will be notified that the viewing request was declined.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="e.g., Property is no longer available at that time..."
                value={declineViewingNote}
                onChange={(e) => setDeclineViewingNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDeclineViewingDialog({ open: false, viewingId: null })
                }
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeclineViewing}>
                <XCircle className="mr-2 h-4 w-4" />
                Decline Viewing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Schedule Viewing Dialog ───────────────────────────────────────── */}
      <Dialog
        open={viewingDialog.open}
        onOpenChange={(open) => setViewingDialog({ open, applicationId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Viewing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proposed Date & Time</label>
              <Input
                type="datetime-local"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message to Tenant (optional)
              </label>
              <Textarea
                placeholder="Additional message about the viewing..."
                value={viewingMessage}
                onChange={(e) => setViewingMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setViewingDialog({ open: false, applicationId: null })
                }
              >
                Cancel
              </Button>
              <Button onClick={scheduleViewing} disabled={!viewingDate}>
                Send Viewing Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) =>
          setApprovalDialog({ open, applicationId: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold mb-2">This will:</p>
              <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
                <li>Create a draft lease for the tenant to sign</li>
                <li>Notify the tenant to review and sign their lease</li>
                <li>Deactivate the property listing</li>
                <li>Automatically reject all other applications</li>
              </ul>
            </div>
            <p className="text-sm">
              Are you sure you want to approve this application?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setApprovalDialog({ open: false, applicationId: null, action: null })
                }
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={submitting}
                onClick={() =>
                  updateApplicationStatus(approvalDialog.applicationId!, "approved")
                }
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve & Create Lease
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Rejection Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={rejectionDialog.open}
        onOpenChange={(open) =>
          setRejectionDialog({ open, applicationId: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter a reason for declining this application:
            </p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setRejectionDialog({ open: false, applicationId: null })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={submitting}
                onClick={() =>
                  updateApplicationStatus(
                    rejectionDialog.applicationId!,
                    "rejected",
                    rejectionReason
                  )
                }
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Decline Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}