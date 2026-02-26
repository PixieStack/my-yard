"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, Users, Coins, FileText, TrendingUp, AlertCircle, Plus, Eye, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  occupiedProperties: number
  maintenanceProperties: number
  totalTenants: number
  pendingApplications: number
  viewingRequests: number
  monthlyRevenue: number
  overduePayments: number
  maintenanceRequests: number
}

interface RecentActivity {
  id: string
  type: "application" | "payment" | "maintenance" | "message" | "viewing" | "lease"
  title: string
  description: string
  time: string
  status?: string
}

export default function LandlordDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    occupiedProperties: 0,
    maintenanceProperties: 0,
    totalTenants: 0,
    pendingApplications: 0,
    viewingRequests: 0,
    monthlyRevenue: 0,
    overduePayments: 0,
    maintenanceRequests: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData()
    }
  }, [profile?.id])

  const fetchDashboardData = async () => {
    try {
      // Fetch properties stats
      const { data: properties } = await supabase
        .from("properties")
        .select("id, status, is_active")
        .eq("landlord_id", profile?.id)

      // Fetch applications with property info
      const { data: applications } = await supabase
        .from("applications")
        .select(`
          id, status, applied_at, property_id,
          property:properties!inner(landlord_id, title)
        `)
        .eq("property.landlord_id", profile?.id)
        .order("applied_at", { ascending: false })

      const { data: viewingRequests } = await supabase
        .from("viewing_requests")
        .select(`
          id, status, requested_date, property_id,
          property:properties!inner(landlord_id)
        `)
        .eq("property.landlord_id", profile?.id)
        .eq("status", "requested")

      // Fetch active leases (approved tenants)
      const { data: leases } = await supabase
        .from("leases")
        .select("id, tenant_id, monthly_rent, is_active")
        .eq("landlord_id", profile?.id)
        .eq("is_active", true)

      // Fetch payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, amount, status, due_date")
        .eq("landlord_id", profile?.id)
        .gte("due_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      // Fetch maintenance requests
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .select("id, status, title, created_at")
        .eq("landlord_id", profile?.id)
        .eq("status", "reported")

      // Calculate stats
      const totalProperties = properties?.length || 0
      const activeProperties = properties?.filter((p) => p.status === "available" && p.is_active).length || 0
      const occupiedProperties = properties?.filter((p) => p.status === "occupied").length || 0
      const maintenanceProperties = properties?.filter((p) => p.status === "maintenance").length || 0
      const totalTenants = leases?.length || 0

      const pendingApplications =
        applications?.filter((a) =>
          ["pending", "viewing_requested", "viewing_scheduled", "viewing_declined"].includes(a.status),
        ).length || 0

      const viewingRequestsCount = viewingRequests?.length || 0
      const monthlyRevenue = leases?.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0) || 0
      const overduePayments =
        payments?.filter((p) => p.status === "overdue" || (p.status === "pending" && new Date(p.due_date) < new Date()))
          .length || 0
      const maintenanceRequestsCount = maintenance?.length || 0

      setStats({
        totalProperties,
        activeProperties,
        occupiedProperties,
        maintenanceProperties,
        totalTenants,
        pendingApplications,
        viewingRequests: viewingRequestsCount,
        monthlyRevenue,
        overduePayments,
        maintenanceRequests: maintenanceRequestsCount,
      })

      const activities: RecentActivity[] = []

      // Recent applications
      applications?.slice(0, 2).forEach((app) => {
        let activityTitle = "New Application"
        let activityType: RecentActivity["type"] = "application"

        if (app.status === "viewing_requested") {
          activityTitle = "Viewing Requested"
          activityType = "viewing"
        } else if (app.status === "approved") {
          activityTitle = "Application Approved"
          activityType = "lease"
        }

        activities.push({
          id: app.id,
          type: activityType,
          title: activityTitle,
          description: `For ${app.property?.[0]?.title || "property"}`,
          time: "2 hours ago",
          status: app.status,
        })
      })

      // Recent viewing requests
      viewingRequests?.slice(0, 2).forEach((req) => {
        activities.push({
          id: req.id,
          type: "viewing",
          title: "Viewing Request",
          description: `Viewing requested for ${new Date(req.requested_date).toLocaleDateString()}`,
          time: "1 day ago",
          status: req.status,
        })
      })

      // Recent maintenance requests
      maintenance?.slice(0, 2).forEach((req) => {
        activities.push({
          id: req.id,
          type: "maintenance",
          title: "Maintenance Request",
          description: req.title,
          time: "1 day ago",
          status: req.status,
        })
      })

      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const occupancyRate = stats.totalProperties > 0 ? (stats.occupiedProperties / stats.totalProperties) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.first_name}!</h2>
          <p className="text-gray-600">Here's what's happening with your properties today.</p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProperties} available • {stats.maintenanceProperties} maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">{occupancyRate.toFixed(1)}% occupancy rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              From {stats.totalTenants} active lease{stats.totalTenants !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications + stats.viewingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} applications • {stats.viewingRequests} viewings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Property Occupancy</CardTitle>
          <CardDescription>Current occupancy rate across all your properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Occupancy Rate</span>
              <span className="text-sm text-muted-foreground">{occupancyRate.toFixed(1)}%</span>
            </div>
            <Progress value={occupancyRate} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.occupiedProperties} occupied</span>
              <span>{stats.activeProperties} available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/landlord/applications">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Review Applications</CardTitle>
              <CardDescription>
                {stats.pendingApplications} application{stats.pendingApplications !== 1 ? "s" : ""} need your attention
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/landlord/tenants">
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Manage Tenants</CardTitle>
              <CardDescription>
                View and communicate with your {stats.totalTenants} active tenant{stats.totalTenants !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/landlord/properties">
            <CardHeader>
              <Building className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Property Management</CardTitle>
              <CardDescription>
                Manage your {stats.totalProperties} propert{stats.totalProperties !== 1 ? "ies" : "y"} and listings
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Alerts & Actions */}
      {(stats.overduePayments > 0 || stats.maintenanceRequests > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.overduePayments > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  You have {stats.overduePayments} overdue payment{stats.overduePayments !== 1 ? "s" : ""} that need
                  attention.
                </p>
                <Link href="/landlord/payments">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Payments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.maintenanceRequests > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  You have {stats.maintenanceRequests} pending maintenance request
                  {stats.maintenanceRequests !== 1 ? "s" : ""}.
                </p>
                <Link href="/landlord/maintenance">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your properties and tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.type === "application" && <FileText className="h-5 w-5 text-blue-600" />}
                    {activity.type === "payment" && <Coins className="h-5 w-5 text-green-600" />}
                    {activity.type === "maintenance" && <AlertCircle className="h-5 w-5 text-orange-600" />}
                    {activity.type === "message" && <MessageSquare className="h-5 w-5 text-purple-600" />}
                    {activity.type === "viewing" && <Eye className="h-5 w-5 text-indigo-600" />}
                    {activity.type === "lease" && <Users className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {activity.status && (
                      <Badge variant={activity.status === "pending" ? "secondary" : "default"}>{activity.status}</Badge>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity to show</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
