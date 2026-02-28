"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MapPin,
  Search,
  Loader2,
  Eye,
  X,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type ViewingStatus = "pending" | "confirmed" | "completed" | "declined"

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

interface Property {
  id: string
  title: string
  address: string
  rent_amount: number
  landlord_id: string
}

interface ViewingRequest {
  id: string
  property_id: string
  tenant_id: string
  status: ViewingStatus
  requested_date: string
  requested_time: string
  tenant_message: string | null
  landlord_message: string | null
  confirmed_date: string | null
  confirmed_time: string | null
  created_at: string
  updated_at: string
  property: Property
  tenant: Tenant
}

export default function LandlordViewingRequestsPage() {
  const { profile } = useAuth()
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [selectedViewing, setSelectedViewing] = useState<ViewingRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"confirm" | "decline" | "mark-completed">("confirm")
  const [landlordMessage, setLandlordMessage] = useState("")
  const [confirmedDate, setConfirmedDate] = useState("")
  const [confirmedTime, setConfirmedTime] = useState("10:00")
  const [submitting, setSubmitting] = useState(false)

  // Fetch viewing requests for landlord's properties
  const fetchViewingRequests = useCallback(async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      setError("")

      // Step 1: Get landlord's properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id")
        .eq("landlord_id", profile.id)

      if (propertiesError) {
        setError("Failed to load properties")
        return
      }

      if (!properties || properties.length === 0) {
        setViewingRequests([])
        return
      }

      const propertyIds = properties.map((p) => p.id)

      // Step 2: Get viewing requests for these properties
      const { data: viewings, error: viewingsError } = await supabase
        .from("viewing_requests")
        .select(
          `
          id,
          property_id,
          tenant_id,
          status,
          requested_date,
          requested_time,
          tenant_message,
          landlord_message,
          confirmed_date,
          confirmed_time,
          created_at,
          updated_at,
          properties:property_id (id, title, address, rent_amount, landlord_id),
          profiles:tenant_id (id, first_name, last_name, email, phone)
        `
        )
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })

      if (viewingsError) {
        setError("Failed to load viewing requests")
        return
      }

      // Transform data
      const transformed = (viewings || []).map((v: any) => ({
        id: v.id,
        property_id: v.property_id,
        tenant_id: v.tenant_id,
        status: v.status,
        requested_date: v.requested_date,
        requested_time: v.requested_time,
        tenant_message: v.tenant_message,
        landlord_message: v.landlord_message,
        confirmed_date: v.confirmed_date,
        confirmed_time: v.confirmed_time,
        created_at: v.created_at,
        updated_at: v.updated_at,
        property: v.properties,
        tenant: v.profiles,
      }))

      setViewingRequests(transformed)
    } catch (err) {
      console.error("Error fetching viewing requests:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchViewingRequests()
  }, [fetchViewingRequests])

  // Confirm viewing
  const handleConfirmViewing = async () => {
    if (!selectedViewing || !confirmedDate) {
      setError("Please select a confirmed date")
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from("viewing_requests")
        .update({
          status: "confirmed",
          confirmed_date: confirmedDate,
          confirmed_time: confirmedTime,
          landlord_message: landlordMessage.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedViewing.id)

      if (updateError) {
        setError("Failed to confirm viewing")
        return
      }

      // Refresh list
      await fetchViewingRequests()
      setDialogOpen(false)
      resetDialog()
    } catch (err) {
      console.error("Error confirming viewing:", err)
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Decline viewing
  const handleDeclineViewing = async () => {
    if (!selectedViewing) return

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from("viewing_requests")
        .update({
          status: "declined",
          landlord_message: landlordMessage.trim() || "Viewing request declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedViewing.id)

      if (updateError) {
        setError("Failed to decline viewing")
        return
      }

      // Refresh list
      await fetchViewingRequests()
      setDialogOpen(false)
      resetDialog()
    } catch (err) {
      console.error("Error declining viewing:", err)
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Mark viewing as completed
  const handleMarkCompleted = async () => {
    if (!selectedViewing) return

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from("viewing_requests")
        .update({
          status: "completed",
          landlord_message: landlordMessage.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedViewing.id)

      if (updateError) {
        setError("Failed to mark viewing as completed")
        return
      }

      // Refresh list
      await fetchViewingRequests()
      setDialogOpen(false)
      resetDialog()
    } catch (err) {
      console.error("Error marking viewing completed:", err)
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const resetDialog = () => {
    setSelectedViewing(null)
    setLandlordMessage("")
    setConfirmedDate("")
    setConfirmedTime("10:00")
  }

  const getStatusColor = (status: ViewingStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: ViewingStatus): string => {
    switch (status) {
      case "pending":
        return "Awaiting Response"
      case "confirmed":
        return "Confirmed"
      case "completed":
        return "Completed"
      case "declined":
        return "Declined"
      default:
        return status
    }
  }

  // Filter viewing requests
  const filtered = viewingRequests.filter((vr) => {
    const matchesSearch =
      !searchTerm.trim() ||
      vr.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vr.tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vr.tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vr.property.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || vr.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-32 bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Viewing Requests</h2>
        <p className="text-gray-600">
          Manage viewing requests from tenants interested in your properties
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by property or tenant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        <span className="font-medium">{filtered.length}</span> viewing request
        {filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Viewing Requests List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((vr) => (
            <Card key={vr.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                  <div className="flex-1">
                    {/* Property & Tenant */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vr.property.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {vr.property.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Tenant:</span> {vr.tenant.first_name} {vr.tenant.last_name}
                      </p>
                      {vr.tenant.email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {vr.tenant.email}
                        </p>
                      )}
                    </div>

                    {/* Requested Date/Time */}
                    <div className="flex flex-wrap gap-4 mb-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {new Date(vr.requested_date + "T00:00:00").toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {vr.requested_time}
                      </span>
                      <Badge className={getStatusColor(vr.status)}>
                        {getStatusText(vr.status)}
                      </Badge>
                    </div>

                    {/* Tenant Message */}
                    {vr.tenant_message && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Tenant's Note:</p>
                        <p className="text-sm text-gray-700">{vr.tenant_message}</p>
                      </div>
                    )}

                    {/* Landlord Message */}
                    {vr.landlord_message && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-600 mb-1">Your Message:</p>
                        <p className="text-sm text-blue-700">{vr.landlord_message}</p>
                      </div>
                    )}

                    {/* Confirmed Date/Time if applicable */}
                    {vr.confirmed_date && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-600 mb-2">Confirmed Viewing:</p>
                        <div className="flex gap-4 text-sm text-green-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(vr.confirmed_date + "T00:00:00").toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {vr.confirmed_time}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:w-48">
                    {vr.status === "pending" && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedViewing(vr)
                            setDialogType("confirm")
                            setDialogOpen(true)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedViewing(vr)
                            setDialogType("decline")
                            setDialogOpen(true)
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    )}

                    {vr.status === "confirmed" && (
                      <Button
                        onClick={() => {
                          setSelectedViewing(vr)
                          setDialogType("mark-completed")
                          setDialogOpen(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}

                    {vr.status === "completed" && (
                      <Link href={`/landlord/applications?property_id=${vr.property_id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Application
                        </Button>
                      </Link>
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
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No viewing requests
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You don't have any viewing requests yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Confirm/Decline/Mark Completed */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "confirm"
                ? "Confirm Viewing"
                : dialogType === "mark-completed"
                  ? "Mark Viewing as Completed"
                  : "Decline Viewing"}
            </DialogTitle>
          </DialogHeader>

          {selectedViewing && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">
                  {selectedViewing.property.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tenant: {selectedViewing.tenant.first_name} {selectedViewing.tenant.last_name}
                </p>
              </div>

              {dialogType === "confirm" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmed Date
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={(e) => setConfirmedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmed Time
                    </label>
                    <input
                      type="time"
                      value={confirmedTime}
                      onChange={(e) => setConfirmedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Tenant (Optional)
                </label>
                <Textarea
                  value={landlordMessage}
                  onChange={(e) => setLandlordMessage(e.target.value)}
                  placeholder="Add a message for the tenant..."
                  className="h-24 resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                resetDialog()
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (dialogType === "confirm") handleConfirmViewing()
                else if (dialogType === "decline") handleDeclineViewing()
                else handleMarkCompleted()
              }}
              disabled={submitting}
              className={
                dialogType === "decline"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : dialogType === "confirm" ? (
                "Confirm Viewing"
              ) : dialogType === "decline" ? (
                "Decline Request"
              ) : (
                "Mark Completed"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
