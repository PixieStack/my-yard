"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { FileText, Plus, Download, PenTool, AlertTriangle, CheckCircle, Clock, Eye, Users } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Lease {
  id: string
  tenant_id: string
  property_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit_amount: number
  status: string
  is_active: boolean
  signed_by_landlord: boolean
  signed_by_tenant: boolean
  cancellation_notice_date: string | null
  created_at: string
  tenant?: { first_name: string; last_name: string; email: string }
  property?: { title: string; address: string }
}

interface Property {
  id: string
  title: string
  address: string
  rent_amount: number
  deposit_amount: number
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function LandlordLeasesPage() {
  const { profile } = useAuth()
  const [leases, setLeases] = useState<Lease[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState<Lease | null>(null)
  const [creating, setCreating] = useState(false)

  const [newLease, setNewLease] = useState({
    tenant_id: "",
    property_id: "",
    start_date: "",
    end_date: "",
    monthly_rent: "",
    deposit_amount: "",
    terms: "",
  })

  useEffect(() => {
    if (profile?.id) {
      fetchLeases()
      fetchProperties()
      fetchTenants()
    }
  }, [profile?.id])

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("*")
        .eq("landlord_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const enriched = await Promise.all(
        (data || []).map(async (lease) => {
          const [{ data: tenant }, { data: property }] = await Promise.all([
            supabase.from("profiles").select("first_name, last_name, email").eq("id", lease.tenant_id).maybeSingle(),
            supabase.from("properties").select("title, address").eq("id", lease.property_id).maybeSingle(),
          ])
          return { ...lease, tenant, property }
        })
      )

      setLeases(enriched)
    } catch (error) {
      console.error("Error fetching leases:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const { data } = await supabase
        .from("properties")
        .select("id, title, address, rent_amount, deposit_amount")
        .eq("landlord_id", profile?.id)
      setProperties(data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }

  const fetchTenants = async () => {
    try {
      const { data: leaseData } = await supabase
        .from("applications")
        .select("tenant_id")
        .eq("status", "approved")

      if (leaseData) {
        const tenantIds = [...new Set(leaseData.map(l => l.tenant_id))]
        if (tenantIds.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", tenantIds)
          setTenants(data || [])
        }
      }
    } catch (error) {
      console.error("Error fetching tenants:", error)
    }
  }

  const createLease = async () => {
    if (!newLease.tenant_id || !newLease.property_id || !newLease.start_date || !newLease.end_date) return

    setCreating(true)
    try {
      const { error } = await supabase.from("leases").insert({
        landlord_id: profile?.id,
        tenant_id: newLease.tenant_id,
        property_id: newLease.property_id,
        start_date: newLease.start_date,
        end_date: newLease.end_date,
        monthly_rent: parseFloat(newLease.monthly_rent),
        deposit_amount: parseFloat(newLease.deposit_amount),
        status: "pending",
        is_active: false,
        signed_by_landlord: false,
        signed_by_tenant: false,
        terms: newLease.terms,
      })

      if (error) throw error

      setShowCreateDialog(false)
      setNewLease({ tenant_id: "", property_id: "", start_date: "", end_date: "", monthly_rent: "", deposit_amount: "", terms: "" })
      fetchLeases()
    } catch (error) {
      console.error("Error creating lease:", error)
    } finally {
      setCreating(false)
    }
  }

  const signLease = async (leaseId: string) => {
    try {
      const { error } = await supabase
        .from("leases")
        .update({ signed_by_landlord: true })
        .eq("id", leaseId)

      if (error) throw error

      const lease = leases.find(l => l.id === leaseId)
      if (lease?.signed_by_tenant) {
        await supabase
          .from("leases")
          .update({ status: "active", is_active: true })
          .eq("id", leaseId)

        if (lease.property_id) {
          await supabase
            .from("properties")
            .update({ status: "occupied" })
            .eq("id", lease.property_id)
        }
      }

      fetchLeases()
    } catch (error) {
      console.error("Error signing lease:", error)
    }
  }

  const cancelLease = async (leaseId: string) => {
    try {
      const cancellationDate = new Date()
      cancellationDate.setDate(cancellationDate.getDate() + 20)

      const { error } = await supabase
        .from("leases")
        .update({
          status: "cancellation_pending",
          cancellation_notice_date: new Date().toISOString(),
          end_date: cancellationDate.toISOString().split("T")[0],
        })
        .eq("id", leaseId)

      if (error) throw error
      fetchLeases()
    } catch (error) {
      console.error("Error cancelling lease:", error)
    }
  }

  const generatePDF = (lease: Lease) => {
    const doc = `
<!DOCTYPE html>
<html><head><title>Lease Agreement - MyYard</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;line-height:1.6}
h1{text-align:center;color:#ea580c;border-bottom:2px solid #ea580c;padding-bottom:10px}
h2{color:#333;margin-top:30px}
.parties{background:#fff7ed;padding:20px;border-radius:8px;margin:20px 0}
.signature{display:flex;justify-content:space-between;margin-top:60px}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;padding-top:8px;margin-top:60px}
.terms{background:#f8fafc;padding:20px;border-radius:8px;border-left:4px solid #ea580c}
.footer{text-align:center;margin-top:40px;color:#666;font-size:12px}
</style></head><body>
<h1>RESIDENTIAL LEASE AGREEMENT</h1>
<p style="text-align:center;color:#666">Generated by MyYard - South Africa's Township Rental Platform</p>

<div class="parties">
<h2>1. PARTIES</h2>
<p><strong>LANDLORD:</strong> ${profile?.first_name} ${profile?.last_name} (${profile?.email})</p>
<p><strong>TENANT:</strong> ${lease.tenant?.first_name} ${lease.tenant?.last_name} (${lease.tenant?.email})</p>
</div>

<h2>2. PREMISES</h2>
<p>The Landlord hereby leases to the Tenant the property known as:</p>
<p><strong>${lease.property?.title}</strong><br/>${lease.property?.address}</p>

<h2>3. TERM</h2>
<p>This lease shall commence on <strong>${new Date(lease.start_date).toLocaleDateString("en-ZA")}</strong> and terminate on <strong>${new Date(lease.end_date).toLocaleDateString("en-ZA")}</strong>.</p>

<h2>4. RENTAL</h2>
<p>Monthly rental: <strong>R${lease.monthly_rent?.toLocaleString()}</strong></p>
<p>Security deposit: <strong>R${lease.deposit_amount?.toLocaleString()}</strong></p>
<p>Rental is payable on or before the 1st day of each month.</p>

<h2>5. CANCELLATION</h2>
<div class="terms">
<p>Either party may cancel this lease by giving <strong>20 (twenty) calendar days</strong> written notice. The cancellation shall take effect 20 days after the notice is delivered.</p>
</div>

<h2>6. GENERAL TERMS</h2>
<ul>
<li>The Tenant shall maintain the premises in good condition</li>
<li>No structural alterations without written consent from the Landlord</li>
<li>The Tenant is responsible for utility payments unless otherwise agreed</li>
<li>The security deposit will be refunded within 14 days of vacating, less any deductions for damages</li>
<li>This agreement is governed by the Rental Housing Act (No. 50 of 1999) of South Africa</li>
</ul>

<div class="signature">
<div class="sig-block">
<div class="sig-line"><strong>LANDLORD</strong><br/>${profile?.first_name} ${profile?.last_name}<br/>Date: ${lease.signed_by_landlord ? new Date().toLocaleDateString("en-ZA") : "________________"}</div>
</div>
<div class="sig-block">
<div class="sig-line"><strong>TENANT</strong><br/>${lease.tenant?.first_name} ${lease.tenant?.last_name}<br/>Date: ${lease.signed_by_tenant ? new Date().toLocaleDateString("en-ZA") : "________________"}</div>
</div>
</div>

<div class="footer">
<p>MyYard &copy; ${new Date().getFullYear()} | This document was generated electronically and constitutes a valid lease agreement.</p>
</div>
</body></html>`

    const blob = new Blob([doc], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank")
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const getStatusBadge = (lease: Lease) => {
    if (lease.status === "cancellation_pending") return <Badge variant="destructive">Cancellation Pending</Badge>
    if (lease.status === "cancelled") return <Badge variant="secondary">Cancelled</Badge>
    if (lease.is_active) return <Badge className="bg-green-100 text-green-800">Active</Badge>
    if (lease.signed_by_landlord && lease.signed_by_tenant) return <Badge className="bg-blue-100 text-blue-800">Fully Signed</Badge>
    if (lease.signed_by_landlord || lease.signed_by_tenant) return <Badge className="bg-yellow-100 text-yellow-800">Partially Signed</Badge>
    return <Badge variant="secondary">Pending Signatures</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse"><CardHeader><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="leases-title">Lease Agreements</h2>
          <p className="text-gray-600">Create, manage and sign lease agreements</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-lease-btn"><Plus className="mr-2 h-4 w-4" />Create Lease</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lease Agreement</DialogTitle>
              <DialogDescription>Fill in the details to generate a lease agreement</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={newLease.property_id} onValueChange={(v) => {
                  const prop = properties.find(p => p.id === v)
                  setNewLease(prev => ({
                    ...prev,
                    property_id: v,
                    monthly_rent: prop?.rent_amount?.toString() || prev.monthly_rent,
                    deposit_amount: prop?.deposit_amount?.toString() || prev.deposit_amount,
                  }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title} - {p.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={newLease.tenant_id} onValueChange={(v) => setNewLease(prev => ({ ...prev, tenant_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newLease.start_date} onChange={e => setNewLease(prev => ({ ...prev, start_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={newLease.end_date} onChange={e => setNewLease(prev => ({ ...prev, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Rent (R)</Label>
                  <Input type="number" value={newLease.monthly_rent} onChange={e => setNewLease(prev => ({ ...prev, monthly_rent: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Deposit (R)</Label>
                  <Input type="number" value={newLease.deposit_amount} onChange={e => setNewLease(prev => ({ ...prev, deposit_amount: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Additional Terms</Label>
                <Textarea value={newLease.terms} onChange={e => setNewLease(prev => ({ ...prev, terms: e.target.value }))} placeholder="Any special conditions..." rows={3} />
              </div>
              <Button onClick={createLease} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Lease Agreement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{leases.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{leases.filter(l => l.is_active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{leases.filter(l => !l.signed_by_landlord || !l.signed_by_tenant).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R{leases.filter(l => l.is_active).reduce((s, l) => s + (l.monthly_rent || 0), 0).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Leases List */}
      {leases.length > 0 ? (
        <div className="space-y-4">
          {leases.map((lease) => (
            <Card key={lease.id} data-testid={`lease-card-${lease.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-lg">{lease.property?.title || "Property"}</h3>
                      {getStatusBadge(lease)}
                    </div>
                    <p className="text-sm text-gray-600">{lease.property?.address}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </span>
                      <span>R{lease.monthly_rent?.toLocaleString()}/mo</span>
                      <span>{new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Signatures:</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${lease.signed_by_landlord ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        Landlord {lease.signed_by_landlord ? "Signed" : "Pending"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${lease.signed_by_tenant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        Tenant {lease.signed_by_tenant ? "Signed" : "Pending"}
                      </span>
                    </div>
                    {lease.cancellation_notice_date && (
                      <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                        <AlertTriangle className="h-4 w-4" />
                        Cancellation notice given on {new Date(lease.cancellation_notice_date).toLocaleDateString()}. Effective {new Date(lease.end_date).toLocaleDateString()}.
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!lease.signed_by_landlord && lease.status !== "cancelled" && (
                      <Button size="sm" onClick={() => signLease(lease.id)} data-testid={`sign-lease-${lease.id}`}>
                        <PenTool className="h-4 w-4 mr-1" />Sign
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => generatePDF(lease)} data-testid={`download-lease-${lease.id}`}>
                      <Download className="h-4 w-4 mr-1" />PDF
                    </Button>
                    {lease.is_active && lease.status !== "cancellation_pending" && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => cancelLease(lease.id)}>
                        <AlertTriangle className="h-4 w-4 mr-1" />Cancel (20-day)
                      </Button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lease agreements</h3>
            <p className="text-gray-600 mb-4">Create your first lease agreement to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />Create Lease
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
