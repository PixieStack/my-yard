"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input, Textarea } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, MapPin, Phone, Mail, Calendar, Coins, MessageSquare, Eye, CreditCard, Send } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Tenant {
  id: string
  lease_id: string
  tenant_profile: {
    profiles: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string
    }
    employment_status: string
    monthly_income: number
  }
  property: {
    id: string
    title: string
    address: string
    township: {
      name: string
    }
  }
  lease: {
    start_date: string
    end_date: string
    monthly_rent: number
    deposit_amount: number
    is_active: boolean
  }
  payment_history: {
    total_paid: number
    overdue_amount: number
    last_payment_date: string
  }
}

export default function TenantsPage() {
  const { profile } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentRequestDialog, setPaymentRequestDialog] = useState<{
    open: boolean
    tenant: Tenant | null
  }>({ open: false, tenant: null })
  const [paymentRequestForm, setPaymentRequestForm] = useState({
    amount: "",
    type: "rent",
    description: "",
    due_date: "",
  })
  const [sendingPaymentRequest, setSendingPaymentRequest] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchTenants()
    }
  }, [profile?.id])

  const fetchTenants = async () => {
    try {
      const { data: leasesData, error: leasesError } = await supabase
        .from("leases")
        .select("id, start_date, end_date, monthly_rent, deposit_amount, is_active, tenant_id, property_id")
        .eq("landlord_id", profile?.id)
        .eq("is_active", true)
        .order("start_date", { ascending: false })

      if (leasesError) {
        console.error("Error fetching leases:", leasesError)
        return
      }

      if (!leasesData || leasesData.length === 0) {
        setTenants([])
        return
      }

      const propertyIds = [...new Set(leasesData.map((lease) => lease.property_id))]
      const tenantIds = [...new Set(leasesData.map((lease) => lease.tenant_id))]

      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, title, address, township_id")
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("Error fetching properties:", propertiesError)
      }

      const townshipIds = [...new Set(propertiesData?.map((p) => p.township_id).filter(Boolean) || [])]
      const { data: townshipsData, error: townshipsError } = await supabase
        .from("townships")
        .select("id, name")
        .in("id", townshipIds)

      if (townshipsError) {
        console.error("Error fetching townships:", townshipsError)
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", tenantIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      }

      const { data: tenantProfilesData, error: tenantProfilesError } = await supabase
        .from("tenant_profiles")
        .select("id, employment_status, monthly_income")
        .in("id", tenantIds)

      if (tenantProfilesError) {
        console.error("Error fetching tenant profiles:", tenantProfilesError)
      }

      const transformedTenants = leasesData.map((lease) => {
        const property = propertiesData?.find((p) => p.id === lease.property_id)
        const township = property ? townshipsData?.find((t) => t.id === property.township_id) : null
        const profile = profilesData?.find((p) => p.id === lease.tenant_id)
        const tenantProfile = tenantProfilesData?.find((tp) => tp.id === lease.tenant_id)

        return {
          id: lease.tenant_id,
          lease_id: lease.id,
          tenant_profile: {
            profiles: profile || {
              id: lease.tenant_id,
              first_name: "Unknown",
              last_name: "Tenant",
              email: "No email",
              phone: null,
            },
            employment_status: tenantProfile?.employment_status || "Unknown",
            monthly_income: tenantProfile?.monthly_income || 0,
          },
          property: {
            id: lease.property_id,
            title: property?.title || "Unknown Property",
            address: property?.address || "Unknown Address",
            township: { name: township?.name || "Unknown" },
          },
          lease: {
            start_date: lease.start_date,
            end_date: lease.end_date,
            monthly_rent: lease.monthly_rent,
            deposit_amount: lease.deposit_amount,
            is_active: lease.is_active,
          },
          payment_history: {
            total_paid: 0,
            overdue_amount: 0,
            last_payment_date: "",
          },
        }
      })

      setTenants(transformedTenants)
    } catch (error) {
      console.error("Error fetching tenants:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.tenant_profile.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.tenant_profile.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.tenant_profile.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property.title.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const sendPaymentRequest = async () => {
    if (!paymentRequestDialog.tenant || !paymentRequestForm.amount) return

    setSendingPaymentRequest(true)
    try {
      const tenant = paymentRequestDialog.tenant

      const { error: paymentError } = await supabase.from("payments").insert({
        tenant_id: tenant.id,
        landlord_id: profile?.id,
        lease_id: tenant.lease_id,
        amount: Number.parseFloat(paymentRequestForm.amount),
        payment_type: paymentRequestForm.type,
        status: "pending",
        due_date: paymentRequestForm.due_date,
        description: paymentRequestForm.description,
      })

      if (paymentError) throw paymentError

      const { error: messageError } = await supabase.from("messages").insert({
        sender_id: profile?.id,
        recipient_id: tenant.id,
        property_id: tenant.property.id,
        subject: `Payment Request - ${paymentRequestForm.type === "rent" ? "Monthly Rent" : "Additional Payment"}`,
        message: `Hello ${tenant.tenant_profile.profiles.first_name},

I am requesting payment for the following:

Amount: R${Number.parseFloat(paymentRequestForm.amount).toLocaleString()}
Type: ${paymentRequestForm.type === "rent" ? "Monthly Rent" : paymentRequestForm.type === "deposit" ? "Security Deposit" : paymentRequestForm.type === "utilities" ? "Utilities" : "Other Payment"}
Due Date: ${new Date(paymentRequestForm.due_date).toLocaleDateString()}
Property: ${tenant.property.title}

${paymentRequestForm.description ? `Details: ${paymentRequestForm.description}` : ""}

Please make payment by the due date. You can submit proof of payment through your tenant portal.

Thank you,
${profile?.first_name} ${profile?.last_name}`,
        message_type: "payment",
      })

      if (messageError) throw messageError

      setPaymentRequestForm({
        amount: "",
        type: "rent",
        description: "",
        due_date: "",
      })
      setPaymentRequestDialog({ open: false, tenant: null })

      console.log("Payment request sent successfully")
    } catch (error) {
      console.error("Error sending payment request:", error)
    } finally {
      setSendingPaymentRequest(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tenants</h2>
          <p className="text-gray-600">Manage your current tenants</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{tenants.length} Active Tenants</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredTenants.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <Card key={`${tenant.id}-${tenant.lease_id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {tenant.tenant_profile.profiles.first_name[0]}
                      {tenant.tenant_profile.profiles.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {tenant.tenant_profile.profiles.first_name} {tenant.tenant_profile.profiles.last_name}
                    </CardTitle>
                    <CardDescription>{tenant.tenant_profile.employment_status}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {tenant.tenant_profile.profiles.email}
                  </div>
                  {tenant.tenant_profile.profiles.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {tenant.tenant_profile.profiles.phone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{tenant.property.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-6">
                    {tenant.property.address}, {tenant.property.township.name}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-green-600">
                    <Coins className="h-4 w-4" />
                    <span className="font-semibold">R{tenant.lease.monthly_rent.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-500">per month</div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Lease until {new Date(tenant.lease.end_date).toLocaleDateString()}
                </div>

                <div className="flex flex-col space-y-2 pt-2">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setPaymentRequestDialog({ open: true, tenant })}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Request Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search" : "Tenants will appear here when you have active leases"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={paymentRequestDialog.open}
        onOpenChange={(open) => setPaymentRequestDialog({ open, tenant: paymentRequestDialog.tenant })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>
              Send a payment request to{" "}
              {paymentRequestDialog.tenant &&
                `${paymentRequestDialog.tenant.tenant_profile.profiles.first_name} ${paymentRequestDialog.tenant.tenant_profile.profiles.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Type</label>
              <Select
                value={paymentRequestForm.type}
                onValueChange={(value) => setPaymentRequestForm({ ...paymentRequestForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Monthly Rent</SelectItem>
                  <SelectItem value="deposit">Security Deposit</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Amount (R)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={paymentRequestForm.amount}
                onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
              <Input
                type="date"
                value={paymentRequestForm.due_date}
                onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, due_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Additional Details (Optional)</label>
              <Textarea
                placeholder="Add any additional information about this payment request..."
                value={paymentRequestForm.description}
                onChange={(e) => setPaymentRequestForm({ ...paymentRequestForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {paymentRequestDialog.tenant && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Property:</p>
                <p className="text-sm text-gray-600">{paymentRequestDialog.tenant.property.title}</p>
                <p className="text-sm text-gray-500">{paymentRequestDialog.tenant.property.address}</p>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setPaymentRequestDialog({ open: false, tenant: null })}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={sendPaymentRequest}
                disabled={!paymentRequestForm.amount || !paymentRequestForm.due_date || sendingPaymentRequest}
              >
                <Send className="mr-2 h-4 w-4" />
                {sendingPaymentRequest ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
