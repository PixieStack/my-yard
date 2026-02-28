"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  FileText, Plus, Download, PenTool, AlertTriangle, Users, Lock,
  Building, Calendar, CreditCard, Trash2, Eye, Ban
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import {
  ExtraCharge, LeaseConfig, ADMIN_FEE, CANCEL_PENALTY, NOTICE_DAYS,
  LEASE_DURATIONS, RENT_DUE_DAYS,
  calculateMoveInTotal, calculateMonthlyTotal, calculateEndDate, formatCurrency, parseLeaseConfig
} from "@/lib/lease-utils"

interface Lease {
  id: string
  tenant_id: string
  property_id: string
  landlord_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit_amount: number
  lease_terms: string | null
  is_active: boolean
  is_signed: boolean
  signed_at: string | null
  created_at: string
  tenant?: { first_name: string; last_name: string; email: string } | null
  property?: { title: string; address: string; rent_amount: number; deposit_amount: number; status?: string } | null
  config?: LeaseConfig | null
}

interface LeasePayload {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string
  is_active: boolean
  is_signed: boolean
}

interface Property {
  id: string
  title: string
  address: string
  property_type: string
  rent_amount: number
  deposit_amount: number
  furnished: boolean
  pets_allowed: boolean
  parking_available: boolean
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
  const [showPreview, setShowPreview] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Form state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [durationMonths, setDurationMonths] = useState(12)
  const [rentDueDay, setRentDueDay] = useState(1)
  const [annualIncrease, setAnnualIncrease] = useState(8)
  const [depositRequired, setDepositRequired] = useState(true)
  const [extras, setExtras] = useState<ExtraCharge[]>([])
  const [newExtraName, setNewExtraName] = useState("")
  const [newExtraAmount, setNewExtraAmount] = useState("")
  const [propertyOptions, setPropertyOptions] = useState({
    furnished: false,
    own_bathroom: true,
    own_kitchen: true,
    parking_included: false,
    wifi_included: false,
    pets_allowed: false,
  })

  useEffect(() => {
    if (profile?.id) {
      fetchLeases()
      fetchProperties()
      fetchTenants()
    }
  }, [profile?.id])

  // ─── Real-time updates ────────────────────────────────────────────────────
  useRealtimeSubscription<LeasePayload>(
    "leases",
    (payload) => {
      if (payload.landlord_id === profile?.id) {
        console.log("📡 Lease update received:", payload)
        fetchLeases()
      }
    },
    { event: "*", enabled: !!profile?.id }
  )

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
            supabase.from("properties").select("title, address, rent_amount, deposit_amount, status").eq("id", lease.property_id).maybeSingle(),
          ])
          return { ...lease, tenant, property, config: parseLeaseConfig(lease.lease_terms) }
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
    const { data } = await supabase
      .from("properties")
      .select("id, title, address, property_type, rent_amount, deposit_amount, furnished, pets_allowed, parking_available")
      .eq("landlord_id", profile?.id)
    setProperties(data || [])
  }

  const fetchTenants = async () => {
    const { data: apps } = await supabase
      .from("applications")
      .select("tenant_id")
      .eq("status", "approved")
    if (apps && apps.length > 0) {
      const ids = [...new Set(apps.map(a => a.tenant_id))]
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", ids)
      setTenants(data || [])
    }
  }

  const handlePropertySelect = (propId: string) => {
    const prop = properties.find(p => p.id === propId) || null
    setSelectedProperty(prop)
    if (prop) {
      setDepositRequired(!!prop.deposit_amount && prop.deposit_amount > 0)
      setPropertyOptions(prev => ({
        ...prev,
        furnished: prop.furnished || false,
        parking_included: prop.parking_available || false,
        pets_allowed: prop.pets_allowed || false,
      }))
    }
  }

  const addExtra = () => {
    if (newExtraName && newExtraAmount) {
      setExtras(prev => [...prev, {
        id: Date.now().toString(),
        name: newExtraName,
        amount: parseFloat(newExtraAmount),
      }])
      setNewExtraName("")
      setNewExtraAmount("")
    }
  }

  const removeExtra = (id: string) => {
    setExtras(prev => prev.filter(e => e.id !== id))
  }

  const rent = selectedProperty?.rent_amount || 0
  const deposit = depositRequired ? (selectedProperty?.deposit_amount || selectedProperty?.rent_amount || 0) : 0
  const moveInTotal = calculateMoveInTotal(rent, depositRequired ? deposit : null, extras)
  const monthlyTotal = calculateMonthlyTotal(rent, extras)
  const endDate = startDate ? calculateEndDate(startDate, durationMonths) : ""

  const createLease = async () => {
    if (!selectedProperty || !selectedTenantId || !startDate) return
    setCreating(true)
    try {
      const config: LeaseConfig = {
        extras,
        deposit_required: depositRequired,
        rent_due_day: rentDueDay,
        duration_months: durationMonths,
        annual_increase_percent: annualIncrease,
        property_options: propertyOptions,
        move_in_total: moveInTotal,
        monthly_total: monthlyTotal,
        cancellation_policy: {
          notice_days: NOTICE_DAYS,
          penalty_amount: CANCEL_PENALTY,
          penalty_applies_without_deposit: true,
        },
        admin_fee: ADMIN_FEE,
      }

      const { error } = await supabase.from("leases").insert({
        landlord_id: profile?.id,
        tenant_id: selectedTenantId,
        property_id: selectedProperty.id,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: rent,
        deposit_amount: deposit,
        lease_terms: JSON.stringify(config),
        is_active: false,
        is_signed: false,
      })

      if (error) throw error

      setShowCreateDialog(false)
      setShowPreview(false)
      resetForm()
      fetchLeases()
    } catch (error) {
      console.error("Error creating lease:", error)
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setSelectedProperty(null)
    setSelectedTenantId("")
    setStartDate("")
    setDurationMonths(12)
    setRentDueDay(1)
    setAnnualIncrease(8)
    setDepositRequired(true)
    setExtras([])
    setPropertyOptions({ furnished: false, own_bathroom: true, own_kitchen: true, parking_included: false, wifi_included: false, pets_allowed: false })
  }

  const signLease = async (leaseId: string) => {
    const lease = leases.find(l => l.id === leaseId)
    if (!lease) return

    const updates: any = {}

    if (!lease.is_signed) {
      // If lease uses old schema (is_signed) - sign it from landlord side
      // For new flow, landlord creates = landlord agrees. Tenant needs to sign.
      // We'll update is_signed only when BOTH have signed.
      // Store landlord signature in lease_terms config
      const config = lease.config || parseLeaseConfig(lease.lease_terms)
      const updatedConfig = { ...config, landlord_signed: true, landlord_signed_at: new Date().toISOString() }
      updates.lease_terms = JSON.stringify(updatedConfig)
    }

    const { error } = await supabase.from("leases").update(updates).eq("id", leaseId)
    if (error) console.error("Error signing:", error)
    fetchLeases()
  }

  const cancelLease = async (leaseId: string) => {
    const cancellationDate = new Date()
    const effectiveDate = new Date()
    effectiveDate.setDate(effectiveDate.getDate() + NOTICE_DAYS)

    const lease = leases.find(l => l.id === leaseId)
    const config = lease?.config
    const updatedConfig = {
      ...config,
      cancellation_notice_date: cancellationDate.toISOString(),
      cancellation_effective_date: effectiveDate.toISOString(),
    }

    const { error } = await supabase.from("leases").update({
      is_active: false,
      end_date: effectiveDate.toISOString().split("T")[0],
      lease_terms: JSON.stringify(updatedConfig),
    }).eq("id", leaseId)

    if (error) console.error("Error cancelling:", error)
    setShowCancelDialog(null)
    fetchLeases()
  }

  const handleUnlistProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: "unlisted" })
        .eq("id", propertyId)

      if (error) throw error

      alert("Property unlisted successfully")
      fetchLeases()
    } catch (err) {
      console.error("Error unlisting property:", err)
      alert("Failed to unlist property. Please try again.")
    }
  }

  const handleRelistProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: "available" })
        .eq("id", propertyId)

      if (error) throw error

      alert("Property relisted successfully")
      fetchLeases()
    } catch (err) {
      console.error("Error relisting property:", err)
      alert("Failed to relist property. Please try again.")
    }
  }

  const generatePDF = (lease: Lease) => {
    const config = lease.config
    const tenant = lease.tenant
    const prop = lease.property

    const extrasHtml = (config?.extras || []).map(e =>
      `<tr><td style="padding:6px 12px">${e.name}</td><td style="padding:6px 12px;text-align:right">${formatCurrency(e.amount)}</td></tr>`
    ).join("")

    const optionsHtml = Object.entries(config?.property_options || {})
      .filter(([, v]) => v)
      .map(([k]) => `<li>${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`)
      .join("")

    const doc = `<!DOCTYPE html><html><head><title>Lease Agreement - MyYard</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;line-height:1.7}
h1{text-align:center;color:#ea580c;border-bottom:3px solid #ea580c;padding-bottom:12px;margin-bottom:8px}
h2{color:#333;margin-top:30px;border-bottom:1px solid #ddd;padding-bottom:6px}
.subtitle{text-align:center;color:#666;margin-bottom:30px}
.box{background:#fff7ed;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #fed7aa}
.cost-box{background:#f0fdf4;padding:20px;border-radius:8px;border:2px solid #86efac;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:10px 0}
table th{background:#f8fafc;padding:8px 12px;text-align:left;border-bottom:2px solid #ddd}
table td{padding:6px 12px;border-bottom:1px solid #eee}
.total-row td{font-weight:bold;border-top:2px solid #333;font-size:1.1em;padding-top:10px}
.signature{display:flex;justify-content:space-between;margin-top:60px}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;padding-top:8px;margin-top:60px}
.footer{text-align:center;margin-top:40px;color:#666;font-size:12px;border-top:1px solid #ddd;padding-top:20px}
.warn{background:#fef2f2;padding:12px 16px;border-radius:8px;border-left:4px solid #ef4444;margin:10px 0}
</style></head><body>
<h1>RESIDENTIAL LEASE AGREEMENT</h1>
<p class="subtitle">Generated by MyYard - South Africa's Township Rental Platform</p>

<div class="box">
<h2 style="margin-top:0">1. PARTIES</h2>
<p><strong>LANDLORD:</strong> ${profile?.first_name} ${profile?.last_name} (${profile?.email})</p>
<p><strong>TENANT:</strong> ${tenant?.first_name} ${tenant?.last_name} (${tenant?.email})</p>
</div>

<h2>2. PREMISES</h2>
<p>The Landlord hereby leases to the Tenant the property known as:</p>
<p><strong>${prop?.title}</strong><br/>${prop?.address}</p>
${optionsHtml ? `<p><strong>Property Features:</strong></p><ul>${optionsHtml}</ul>` : ""}

<h2>3. TERM</h2>
<p>Duration: <strong>${config?.duration_months || 12} months</strong></p>
<p>Start: <strong>${new Date(lease.start_date).toLocaleDateString("en-ZA")}</strong></p>
<p>End: <strong>${new Date(lease.end_date).toLocaleDateString("en-ZA")}</strong></p>
<p>Rent Due: <strong>${config?.rent_due_day || 1}${config?.rent_due_day === 1 ? 'st' : 'th'} of each month</strong></p>
<p>Annual Increase: <strong>${config?.annual_increase_percent || 0}%</strong></p>

<h2>4. FINANCIAL TERMS</h2>
<div class="cost-box">
<h3 style="margin-top:0">MOVE-IN COST (First Payment)</h3>
<table>
<tr><td>Base Rent</td><td style="text-align:right">${formatCurrency(lease.monthly_rent)}</td></tr>
${lease.deposit_amount > 0 ? `<tr><td>Security Deposit</td><td style="text-align:right">${formatCurrency(lease.deposit_amount)}</td></tr>` : ""}
${extrasHtml}
<tr class="total-row"><td>TOTAL MOVE-IN</td><td style="text-align:right">${formatCurrency(config?.move_in_total || 0)}</td></tr>
</table>
</div>

<table>
<tr><th colspan="2">MONTHLY PAYMENT (After Move-In)</th></tr>
<tr><td>Base Rent</td><td style="text-align:right">${formatCurrency(lease.monthly_rent)}</td></tr>
${extrasHtml}
<tr class="total-row"><td>MONTHLY TOTAL</td><td style="text-align:right">${formatCurrency(config?.monthly_total || 0)}</td></tr>
</table>

<h2>5. CANCELLATION POLICY</h2>
<div class="warn">
<p><strong>${NOTICE_DAYS}+ days notice</strong> before month end = No penalty</p>
<p><strong>Less than ${NOTICE_DAYS} days</strong> = ${formatCurrency(CANCEL_PENALTY)} penalty</p>
<p>Penalty deducted from deposit (if applicable)</p>
</div>

<h2>6. GENERAL TERMS</h2>
<ul>
<li>The Tenant shall maintain the premises in good condition</li>
<li>No structural alterations without written consent from the Landlord</li>
<li>The Tenant is responsible for utility payments unless explicitly included</li>
<li>The security deposit will be refunded within 14 days of vacating, less any deductions for damages</li>
<li>This agreement is governed by the Rental Housing Act (No. 50 of 1999) of South Africa</li>
<li>All payments processed through MyYard's secure payment system (Ozow)</li>
</ul>

<div class="signature">
<div class="sig-block"><div class="sig-line"><strong>LANDLORD</strong><br/>${profile?.first_name} ${profile?.last_name}<br/>Date: ________________</div></div>
<div class="sig-block"><div class="sig-line"><strong>TENANT</strong><br/>${tenant?.first_name} ${tenant?.last_name}<br/>Date: ________________</div></div>
</div>

<div class="footer">
<p>MyYard &copy; ${new Date().getFullYear()} | Admin Fee: ${formatCurrency(ADMIN_FEE)} applies to landlord per lease | This document was generated electronically and constitutes a valid lease agreement.</p>
</div>
</body></html>`

    const blob = new Blob([doc], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const pw = window.open(url, "_blank")
    if (pw) pw.onload = () => pw.print()
  }

  const getStatusInfo = (lease: Lease) => {
    const config = lease.config
    if (config && (config as any).cancellation_notice_date) {
      return { label: "Cancellation Pending", variant: "destructive" as const, color: "text-red-600" }
    }
    if (lease.is_active && lease.is_signed) return { label: "Active", variant: "default" as const, color: "text-green-600" }
    if (lease.is_signed) return { label: "Signed - Pending Payment", variant: "secondary" as const, color: "text-blue-600" }
    if (config && (config as any).landlord_signed) return { label: "Landlord Signed - Awaiting Tenant", variant: "secondary" as const, color: "text-yellow-600" }
    return { label: "Pending Signatures", variant: "outline" as const, color: "text-gray-600" }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardHeader><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader></Card>)}</div>
  }

  return (
    <div className="space-y-6" data-testid="landlord-leases-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="leases-title">Lease Agreements</h2>
          <p className="text-gray-600">Create, manage and sign lease agreements</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { resetForm(); setShowPreview(false) } }}>
          <DialogTrigger asChild>
            <Button data-testid="create-lease-btn"><Plus className="mr-2 h-4 w-4" />Create Lease</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showPreview ? "Preview Lease" : "Create Lease Agreement"}</DialogTitle>
              <DialogDescription>{showPreview ? "Review the auto-calculated amounts before sending to tenant" : "Select property and tenant - amounts auto-populate"}</DialogDescription>
            </DialogHeader>

            {!showPreview ? (
              <div className="space-y-6 py-4">
                {/* Property Selection */}
                <div className="space-y-2">
                  <Label className="font-semibold flex items-center gap-2"><Building className="h-4 w-4" />Select Property</Label>
                  <Select value={selectedProperty?.id || ""} onValueChange={handlePropertySelect}>
                    <SelectTrigger><SelectValue placeholder="Choose a property..." /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} - {p.address} ({p.property_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-Loaded Pricing (read-only) */}
                {selectedProperty && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-orange-800 flex items-center gap-1"><Lock className="h-3 w-3" /> Auto-Loaded from Property (read-only)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium">{selectedProperty.property_type}</span>
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-medium">{formatCurrency(selectedProperty.rent_amount)} <Lock className="inline h-3 w-3 text-orange-500" /></span>
                      <span className="text-gray-600">Deposit:</span>
                      <span className="font-medium">{depositRequired ? formatCurrency(selectedProperty.deposit_amount || selectedProperty.rent_amount) : "None"} <Lock className="inline h-3 w-3 text-orange-500" /></span>
                    </div>
                  </div>
                )}

                {/* Tenant Selection */}
                <div className="space-y-2">
                  <Label className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Select Tenant</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger><SelectValue placeholder="Choose a tenant..." /></SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lease Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lease Duration</Label>
                    <Select value={String(durationMonths)} onValueChange={v => setDurationMonths(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEASE_DURATIONS.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rent Due Day</Label>
                    <Select value={String(rentDueDay)} onValueChange={v => setRentDueDay(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RENT_DUE_DAYS.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Increase (%)</Label>
                    <Input type="number" value={annualIncrease} onChange={e => setAnnualIncrease(Number(e.target.value))} min={0} max={20} />
                  </div>
                </div>

                {/* Deposit Toggle */}
                <div className="flex items-center gap-3">
                  <Checkbox checked={depositRequired} onCheckedChange={(v) => setDepositRequired(v as boolean)} id="deposit-required" />
                  <Label htmlFor="deposit-required">Deposit Required</Label>
                </div>

                {/* Extra Charges */}
                <div className="space-y-3">
                  <Label className="font-semibold">Extra Monthly Charges</Label>
                  {extras.map(e => (
                    <div key={e.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="flex-1 text-sm">{e.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(e.amount)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeExtra(e.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="e.g. Water & Sewage" value={newExtraName} onChange={e => setNewExtraName(e.target.value)} className="flex-1" />
                    <Input placeholder="Amount" type="number" value={newExtraAmount} onChange={e => setNewExtraAmount(e.target.value)} className="w-28" />
                    <Button variant="outline" size="sm" onClick={addExtra} disabled={!newExtraName || !newExtraAmount}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* Property Options */}
                <div className="space-y-3">
                  <Label className="font-semibold">Property Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(propertyOptions).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox checked={val} onCheckedChange={(v) => setPropertyOptions(prev => ({ ...prev, [key]: v as boolean }))} id={key} />
                        <Label htmlFor={key} className="text-sm capitalize">{key.replace(/_/g, ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Auto-Calculated Summary */}
                {selectedProperty && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
                    <p className="font-bold text-green-800 text-sm">AUTO-CALCULATED</p>
                    {endDate && <p className="text-sm">End Date: <strong>{new Date(endDate).toLocaleDateString("en-ZA")}</strong> (auto)</p>}

                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="font-semibold text-sm mb-2">MOVE-IN / FIRST MONTH COST</p>
                      {depositRequired && <div className="flex justify-between text-sm"><span>Deposit</span><span>{formatCurrency(deposit)}</span></div>}
                      <div className="flex justify-between text-sm"><span>First Month Rent</span><span>{formatCurrency(rent)}</span></div>
                      {extras.map(e => <div key={e.id} className="flex justify-between text-sm"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>)}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold"><span>TOTAL MOVE-IN</span><span className="text-green-700">{formatCurrency(moveInTotal)}</span></div>
                      <p className="text-xs text-gray-500 mt-1">This is what tenant pays to move in.</p>
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-600">Monthly thereafter: </span>
                      <span className="font-bold">{formatCurrency(monthlyTotal)}</span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button
                    onClick={() => setShowPreview(true)}
                    disabled={!selectedProperty || !selectedTenantId || !startDate}
                    data-testid="preview-lease-btn"
                  >
                    <Eye className="mr-2 h-4 w-4" />Preview Lease
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              /* PREVIEW MODE */
              <div className="space-y-4 py-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-bold">{selectedProperty?.title}</h3>
                  <p className="text-sm text-gray-600">{selectedProperty?.address}</p>
                  <p className="text-sm mt-1">Tenant: <strong>{tenants.find(t => t.id === selectedTenantId)?.first_name} {tenants.find(t => t.id === selectedTenantId)?.last_name}</strong></p>
                  <p className="text-sm">Duration: <strong>{durationMonths} months</strong> ({new Date(startDate).toLocaleDateString("en-ZA")} - {endDate ? new Date(endDate).toLocaleDateString("en-ZA") : ""})</p>
                </div>

                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-bold mb-3">MOVE-IN COST</h4>
                  {depositRequired && <div className="flex justify-between text-sm py-1"><span>Deposit</span><span>{formatCurrency(deposit)}</span></div>}
                  <div className="flex justify-between text-sm py-1"><span>First Month Rent</span><span>{formatCurrency(rent)}</span></div>
                  {extras.map(e => <div key={e.id} className="flex justify-between text-sm py-1"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>)}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg"><span>TOTAL MOVE-IN</span><span className="text-green-700">{formatCurrency(moveInTotal)}</span></div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  Monthly thereafter: <strong>{formatCurrency(monthlyTotal)}</strong>
                  <br />Admin Fee: <strong>{formatCurrency(ADMIN_FEE)}</strong> (charged to you after lease activation)
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>Back</Button>
                  <Button onClick={createLease} disabled={creating} data-testid="send-to-tenant-btn">
                    {creating ? "Sending..." : "Send to Tenant"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Leases</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{leases.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Active</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{leases.filter(l => l.is_active).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{leases.filter(l => !l.is_active && !l.is_signed).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(leases.filter(l => l.is_active).reduce((s, l) => s + (l.config?.monthly_total || l.monthly_rent || 0), 0))}</div></CardContent></Card>
      </div>

      {/* Leases List */}
      {leases.length > 0 ? (
        <div className="space-y-4">
          {leases.map((lease) => {
            const status = getStatusInfo(lease)
            const config = lease.config
            return (
              <Card key={lease.id} data-testid={`lease-card-${lease.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">{lease.property?.title || "Property"}</h3>
                        <Badge variant={status.variant} className={status.color}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{lease.property?.address}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" />{lease.tenant?.first_name} {lease.tenant?.last_name}</span>
                        <span className="flex items-center gap-1"><CreditCard className="h-4 w-4" />{formatCurrency(config?.monthly_total || lease.monthly_rent)}/mo</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}</span>
                      </div>
                      {config && (
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>Move-in: {formatCurrency(config.move_in_total)}</span>
                          <span>Deposit: {config.deposit_required ? formatCurrency(lease.deposit_amount) : "None"}</span>
                          {config.extras?.length > 0 && <span>Extras: {config.extras.map(e => e.name).join(", ")}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!(config as any)?.landlord_signed && !lease.is_signed && (
                        <Button size="sm" onClick={() => signLease(lease.id)} data-testid={`sign-${lease.id}`}>
                          <PenTool className="h-4 w-4 mr-1" />Sign
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => generatePDF(lease)}>
                        <Download className="h-4 w-4 mr-1" />PDF
                      </Button>
                      {lease.is_active && !(config as any)?.cancellation_notice_date && lease.property?.status === "available" && (
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleUnlistProperty(lease.property_id)}>
                          <Eye className="h-4 w-4 mr-1" />Unlist
                        </Button>
                      )}
                      {lease.is_active && !(config as any)?.cancellation_notice_date && lease.property?.status === "unlisted" && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRelistProperty(lease.property_id)}>
                          <Building className="h-4 w-4 mr-1" />Relist
                        </Button>
                      )}
                      {lease.is_active && !(config as any)?.cancellation_notice_date && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowCancelDialog(lease.id)}>
                          <Ban className="h-4 w-4 mr-1" />Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lease agreements</h3>
          <p className="text-gray-600 mb-4">Create your first lease agreement to get started</p>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="mr-2 h-4 w-4" />Create Lease</Button>
        </CardContent></Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!showCancelDialog} onOpenChange={() => setShowCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Cancel Lease Agreement</DialogTitle>
            <DialogDescription>
              This will issue a {NOTICE_DAYS}-day cancellation notice. The lease will terminate in {NOTICE_DAYS} days.
              {!leases.find(l => l.id === showCancelDialog)?.config?.deposit_required && (
                <span className="block mt-2 text-red-600 font-medium">
                  A {formatCurrency(CANCEL_PENALTY)} cancellation penalty may apply (no deposit on file).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(null)}>Keep Lease</Button>
            <Button variant="destructive" onClick={() => showCancelDialog && cancelLease(showCancelDialog)}>
              Confirm Cancellation ({NOTICE_DAYS}-day notice)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
