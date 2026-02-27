"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, MapPin, DollarSign, Calendar, Eye, Building } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

interface Application {
  id: string
  status: "pending" | "approved" | "rejected"
  applied_at: string
  proposed_move_in_date: string
  lease_duration_requested: number
  tenant_notes: string
  rejection_reason: string | null
  property: {
    id: string
    title: string
    rent_amount: number
    address: string
    property_type: string
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
      first_name: string
      last_name: string
    }
  }
}

export default function TenantApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (profile?.id) {
      fetchApplications()
    }
  }, [profile?.id])

  const fetchApplications = async () => {
    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at, proposed_move_in_date, lease_duration_requested, 
          tenant_notes, rejection_reason,
          property:properties(
            id, title, rent_amount, address, property_type, landlord_id,
            township:townships(name, municipality),
            property_images(image_url, is_primary)
          )
        `)
        .eq("tenant_id", profile?.id)
        .order("applied_at", { ascending: false })

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError)
        return
      }

      // Get unique landlord IDs
      const landlordIds = [...new Set(applicationsData?.map((app) => app.property?.landlord_id).filter(Boolean))]

      // Fetch landlord profiles separately
      const { data: landlordsData, error: landlordsError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", landlordIds)

      if (landlordsError) {
        console.error("Error fetching landlords:", landlordsError)
      }

      // Combine the data
      const applicationsWithLandlords =
        applicationsData?.map((app) => ({
          ...app,
          property: {
            ...app.property,
            landlord: landlordsData?.find((landlord) => landlord.id === app.property.landlord_id) || {
              first_name: "Unknown",
              last_name: "Landlord",
            },
          },
        })) || []

      setApplications(applicationsWithLandlords)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.property.township.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || application.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "room":
        return "Room"
      case "bachelor":
        return "Bachelor"
      case "cottage":
        return "Cottage"
      default:
        return type
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-600">Track your rental applications</p>
        </div>
        <Link href="/tenant/properties">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Browse Properties
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const primaryImage = application.property.property_images?.find((img) => img.is_primary)?.image_url

            return (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
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
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{application.property.title}</h3>
                          <p className="text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.property.township.name}, {application.property.township.municipality}
                          </p>
                        </div>
                        <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />R{application.property.rent_amount.toLocaleString()}
                          /month
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          Move-in: {new Date(application.proposed_move_in_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-1" />
                          {application.lease_duration_requested} month lease
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Applied {new Date(application.applied_at).toLocaleDateString()} • Landlord:{" "}
                          {application.property.landlord.first_name} {application.property.landlord.last_name}
                        </div>
                        <Link href={`/tenant/applications/${application.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>

                      {application.status === "rejected" && application.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {application.rejection_reason}
                          </p>
                        </div>
                      )}

                      {application.status === "approved" && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Congratulations!</strong> Your application has been approved. The landlord will
                            contact you soon to proceed with the lease agreement.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You haven't applied for any properties yet"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link href="/tenant/properties">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
