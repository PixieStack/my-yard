"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Coins,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Receipt,
  Upload,
  FileText,
  CreditCard,
  Building,
  Zap,
  Banknote,
  Smartphone,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { parseLeaseConfig, formatCurrency as fmtCurrency } from "@/lib/lease-utils"

interface ActiveLease {
  id: string
  property_title: string
  monthly_rent: number
  monthly_total: number
  deposit_amount: number
  move_in_total: number
  is_active: boolean
  is_signed: boolean
  start_date: string
  extras: { name: string; amount: number }[]
  rent_due_day: number
}


interface Payment {
  id: string
  amount: number
  due_date: string
  paid_date: string | null
  status: "pending" | "paid" | "overdue"
  payment_type: "rent" | "deposit" | "utilities" | "maintenance" | "other"
  transaction_reference: string | null
  payment_method: string | null
  description: string | null
  payment_proof_url: string | null
  property: {
    title: string
    address: string
  }
}

export default function TenantPaymentsPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_type: "rent",
    payment_method: "bank_transfer",
    transaction_reference: "",
    description: "",
    payment_proof_url: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    nextPaymentDue: null as string | null,
  })
  const [activeLeases, setActiveLeases] = useState<ActiveLease[]>([])

  useEffect(() => {
    if (profile?.id) {
      fetchPayments()
      fetchActiveLeases()
    }
  }, [profile?.id])

  const fetchActiveLeases = async () => {
    try {
      const { data } = await supabase
        .from("leases")
        .select("id, monthly_rent, deposit_amount, is_active, is_signed, start_date, lease_terms, property_id")
        .eq("tenant_id", profile?.id)
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        const enriched = await Promise.all(
          data.map(async (lease) => {
            const config = parseLeaseConfig(lease.lease_terms)
            const { data: prop } = await supabase.from("properties").select("title").eq("id", lease.property_id).maybeSingle()
            return {
              id: lease.id,
              property_title: prop?.title || "Property",
              monthly_rent: lease.monthly_rent,
              monthly_total: config?.monthly_total || lease.monthly_rent,
              deposit_amount: lease.deposit_amount,
              move_in_total: config?.move_in_total || (lease.deposit_amount + lease.monthly_rent),
              is_active: lease.is_active,
              is_signed: lease.is_signed,
              start_date: lease.start_date,
              extras: config?.extras || [],
              rent_due_day: config?.rent_due_day || 1,
            }
          })
        )
        setActiveLeases(enriched)
      }
    } catch (err) {
      console.error("Error fetching leases:", err)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          "id, amount, due_date, paid_date, status, payment_type, transaction_reference, payment_method, description, payment_proof_url, lease_id",
        )
        .eq("tenant_id", profile?.id)
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

      // Get unique lease IDs
      const leaseIds = [...new Set(paymentsData.map((p) => p.lease_id).filter(Boolean))]

      // Fetch lease and property data separately
      const { data: leasesData, error: leasesError } = await supabase
        .from("leases")
        .select("id, property_id")
        .in("id", leaseIds)

      if (leasesError) {
        console.error("Error fetching leases:", leasesError)
      }

      // Get property IDs
      const propertyIds = [...new Set(leasesData?.map((l) => l.property_id) || [])]

      // Fetch properties separately
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, title, address")
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("Error fetching properties:", propertiesError)
      }

      // Create lookup maps
      const leasesMap = new Map(leasesData?.map((l) => [l.id, l]) || [])
      const propertiesMap = new Map(propertiesData?.map((p) => [p.id, p]) || [])

      // Transform payments with property data
      const transformedPayments = paymentsData.map((payment) => {
        const lease = payment.lease_id ? leasesMap.get(payment.lease_id) : null
        const property = lease ? propertiesMap.get(lease.property_id) : null

        return {
          ...payment,
          property: property || { title: "Unknown Property", address: "Unknown Address" },
        }
      })

      setPayments(transformedPayments)

      const totalPaid = transformedPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
      const totalPending = transformedPayments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0)
      const totalOverdue = transformedPayments
        .filter((p) => p.status === "overdue")
        .reduce((sum, p) => sum + p.amount, 0)

      const nextPayment = transformedPayments
        .filter((p) => p.status === "pending")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

      setStats({
        totalPaid,
        totalPending,
        totalOverdue,
        nextPaymentDue: nextPayment?.due_date || null,
      })
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesType = typeFilter === "all" || payment.payment_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
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

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "rent":
        return "Rent"
      case "deposit":
        return "Deposit"
      case "utilities":
        return "Utilities"
      case "maintenance":
        return "Maintenance"
      default:
        return type
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!paymentForm.amount || Number.parseFloat(paymentForm.amount) <= 0) {
      errors.amount = "Please enter a valid amount"
    }

    if (!paymentForm.transaction_reference.trim()) {
      errors.transaction_reference = "Transaction reference is required"
    }

    if (paymentForm.transaction_reference.length < 3) {
      errors.transaction_reference = "Reference must be at least 3 characters"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitPaymentProof = async () => {
    if (!validateForm()) return

    setSubmittingPayment(true)
    try {
      const { error } = await supabase.from("payments").insert({
        tenant_id: profile?.id,
        amount: Number.parseFloat(paymentForm.amount),
        payment_type: paymentForm.payment_type,
        payment_method: paymentForm.payment_method,
        transaction_reference: paymentForm.transaction_reference,
        description: paymentForm.description,
        payment_proof_url: paymentForm.payment_proof_url,
        status: "pending",
        due_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setPaymentForm({
        amount: "",
        payment_type: "rent",
        payment_method: "bank_transfer",
        transaction_reference: "",
        description: "",
        payment_proof_url: "",
      })
      setFormErrors({})
      setShowPaymentDialog(false)

      fetchPayments()
    } catch (error) {
      console.error("Error submitting payment:", error)
    } finally {
      setSubmittingPayment(false)
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
          <h2 className="text-2xl font-bold text-gray-900">My Payments</h2>
          <p className="text-gray-600">Track your rental payments and submit payment proof</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => alert("Ozow integration coming soon! The landlord will be notified when the integration is active.")}
            data-testid="pay-with-ozow-btn"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Online (Ozow)
          </Button>
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-payment-btn">
                <Plus className="mr-2 h-4 w-4" />
                Submit Payment
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Receipt className="mr-3 h-6 w-6 text-emerald-600" />
                Submit Payment Proof
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base">
                Submit proof of your rental payment with transaction details. This helps your landlord track and verify
                your payment quickly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-4">
              {/* Payment Amount Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center">
                      Amount (R) <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        R
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={paymentForm.amount}
                        onChange={(e) => {
                          setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                          if (formErrors.amount) {
                            setFormErrors((prev) => ({ ...prev, amount: "" }))
                          }
                        }}
                        className={`pl-8 h-12 text-lg font-medium border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                          formErrors.amount ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                    </div>
                    {formErrors.amount && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_type" className="text-sm font-medium text-gray-700 flex items-center">
                      Payment Type <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={paymentForm.payment_type}
                      onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, payment_type: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Monthly Rent
                          </div>
                        </SelectItem>
                        <SelectItem value="deposit">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Security Deposit
                          </div>
                        </SelectItem>
                        <SelectItem value="utilities">
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2" />
                            Utilities
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Maintenance Fee
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Method Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700 flex items-center">
                    How did you pay? <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={paymentForm.payment_method}
                    onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Bank Transfer
                        </div>
                      </SelectItem>
                      <SelectItem value="eft">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          EFT Payment
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center">
                          <Banknote className="h-4 w-4 mr-2" />
                          Cash Payment
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile_money">
                        <div className="flex items-center">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Mobile Money
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference" className="text-sm font-medium text-gray-700 flex items-center">
                    Transaction Reference <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="reference"
                    placeholder="Enter payment reference number"
                    value={paymentForm.transaction_reference}
                    onChange={(e) => {
                      setPaymentForm((prev) => ({ ...prev, transaction_reference: e.target.value }))
                      if (formErrors.transaction_reference) {
                        setFormErrors((prev) => ({ ...prev, transaction_reference: "" }))
                      }
                    }}
                    className={`h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                      formErrors.transaction_reference ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  {formErrors.transaction_reference ? (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.transaction_reference}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Bank reference, transaction ID, or receipt number from your payment
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Receipt Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Receipt Upload</h3>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors bg-gray-50 hover:bg-emerald-50">
                  <Input
                    id="receipt_upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setPaymentForm((prev) => ({ ...prev, payment_proof_url: file.name }))
                      }
                    }}
                    className="hidden"
                  />
                  <Label htmlFor="receipt_upload" className="cursor-pointer">
                    <div className="space-y-3">
                      <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900">Click to upload receipt</p>
                        <p className="text-sm text-gray-500">PNG, JPG or PDF up to 5MB</p>
                      </div>
                    </div>
                  </Label>
                  {paymentForm.payment_proof_url && (
                    <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                      <p className="text-sm text-emerald-800 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {paymentForm.payment_proof_url}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Notes or Comments
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Any additional information about this payment (e.g., partial payment, late fee included, etc.)"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                  />
                  <p className="text-xs text-gray-500">{paymentForm.description.length}/500 characters</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false)
                    setFormErrors({})
                  }}
                  className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                  disabled={submittingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitPaymentProof}
                  disabled={!paymentForm.amount || !paymentForm.transaction_reference || submittingPayment}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 h-12 min-w-[160px]"
                >
                  {submittingPayment ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Payment
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R{stats.totalOverdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.nextPaymentDue ? new Date(stats.nextPaymentDue).toLocaleDateString() : "None"}
            </div>
            <p className="text-xs text-muted-foreground">Due date</p>
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
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your rental payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(payment.status)}</div>
                    <div>
                      <p className="font-medium">{payment.property.title}</p>
                      <p className="text-sm text-gray-600">{getPaymentTypeLabel(payment.payment_type)}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">R{payment.amount.toLocaleString()}</span>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </div>
                    {payment.paid_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Paid: {new Date(payment.paid_date).toLocaleDateString()}
                      </p>
                    )}
                    {payment.transaction_reference && (
                      <p className="text-xs text-gray-500">Ref: {payment.transaction_reference}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">Your payment history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
