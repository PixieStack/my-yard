"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Search, AlertCircle, CheckCircle, Clock, Download } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  paid_date: string | null
  due_date: string
  status: "pending" | "paid" | "overdue" | "partial"
  payment_method: string
  reference_number: string
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
  property: {
    title: string
    address: string
  }
  lease: {
    monthly_rent: number
  }
}

export default function PaymentsPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidThisMonth: 0,
  })

  useEffect(() => {
    if (profile?.id) {
      fetchPayments()
    }
  }, [profile?.id])

  const fetchPayments = async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("id, amount, paid_date, due_date, status, payment_method, transaction_reference, lease_id, tenant_id")
        .eq("landlord_id", profile?.id)
        .order("due_date", { ascending: false })

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError)
        return
      }

      if (!paymentsData || paymentsData.length === 0) {
        setPayments([])
        setLoading(false)
        return
      }

      const leaseIds = [...new Set(paymentsData.map((p) => p.lease_id).filter(Boolean))]
      const tenantIds = [...new Set(paymentsData.map((p) => p.tenant_id))]

      // Fetch lease details separately
      const { data: leasesData, error: leasesError } = await supabase
        .from("leases")
        .select("id, monthly_rent, tenant_id, property_id")
        .in("id", leaseIds)

      if (leasesError) {
        console.error("Error fetching leases:", leasesError)
      }

      // Get property IDs from leases
      const propertyIds = [...new Set(leasesData?.map((l) => l.property_id) || [])]

      // Fetch tenant profiles separately
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", tenantIds)

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError)
      }

      // Fetch property details separately
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, title, address")
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("Error fetching properties:", propertiesError)
      }

      const leasesMap = new Map(leasesData?.map((l) => [l.id, l]) || [])
      const tenantsMap = new Map(tenantsData?.map((t) => [t.id, t]) || [])
      const propertiesMap = new Map(propertiesData?.map((p) => [p.id, p]) || [])

      // Transform data by combining all the fetched data
      const transformedPayments = paymentsData.map((payment: any) => {
        const lease = payment.lease_id ? leasesMap.get(payment.lease_id) : null
        const tenant = tenantsMap.get(payment.tenant_id)
        const property = lease ? propertiesMap.get(lease.property_id) : null

        return {
          id: payment.id,
          amount: payment.amount,
          paid_date: payment.paid_date,
          due_date: payment.due_date,
          status: payment.status,
          payment_method: payment.payment_method || "Unknown",
          reference_number: payment.transaction_reference || "N/A",
          tenant: tenant || { first_name: "Unknown", last_name: "Tenant", email: "" },
          property: property || { title: "Unknown Property", address: "" },
          lease: {
            monthly_rent: lease?.monthly_rent || 0,
          },
        }
      })

      setPayments(transformedPayments)

      // Calculate stats
      const totalRevenue = transformedPayments
        .filter((p: Payment) => p.status === "paid")
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)

      const pendingAmount = transformedPayments
        .filter((p: Payment) => p.status === "pending")
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)

      const overdueAmount = transformedPayments
        .filter((p: Payment) => p.status === "overdue")
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const paidThisMonth = transformedPayments
        .filter((p: Payment) => {
          if (!p.paid_date) return false
          const paymentDate = new Date(p.paid_date)
          return (
            p.status === "paid" && paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
          )
        })
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)

      setStats({
        totalRevenue,
        pendingAmount,
        overdueAmount,
        paidThisMonth,
      })
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "overdue":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-600">Track rental payments and revenue</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(payment.status)}</div>
                    <div>
                      <p className="font-medium">
                        {payment.tenant.first_name} {payment.tenant.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{payment.property.title}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </div>
                    {payment.paid_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Paid: {new Date(payment.paid_date).toLocaleDateString()}
                      </p>
                    )}
                    {payment.reference_number && payment.reference_number !== "N/A" && (
                      <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">Payment history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
