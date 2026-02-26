"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  FileText, Download, PenTool, AlertTriangle, Users, Lock, CreditCard,
  Calendar, CheckCircle, Home, Ban, Shield
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import {
  LeaseConfig, ADMIN_FEE, CANCEL_PENALTY, NOTICE_DAYS,
  formatCurrency, parseLeaseConfig
} from "@/lib/lease-utils"

interface Lease {
  id: string
  landlord_id: string
  property_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit_amount: number
  lease_terms: string | null
  is_active: boolean
  is_signed: boolean
  signed_at: string | null
  created_at: string
  landlord?: { first_name: string; last_name: string; email: string } | null
  property?: { title: string; address: string; property_type: string } | null
  config?: LeaseConfig | null
}

export default function TenantLeasesPage() {
  const { profile } = useAuth()
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [signingLease, setSigningLease] = useState<Lease | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [payingLease, setPayingLease] = useState<Lease | null>(null)

  useEffect(() => {
    if (profile?.id) fetchLeases()
  }, [profile?.id])

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("*")
        .eq("tenant_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const enriched = await Promise.all(
        (data || []).map(async (lease) => {
          const [{ data: landlord }, { data: property }] = await Promise.all([
            supabase.from("profiles").select("first_name, last_name, email").eq("id", lease.landlord_id).maybeSingle(),
            supabase.from("properties").select("title, address, property_type").eq("id", lease.property_id).maybeSingle(),
          ])
          return { ...lease, landlord, property, config: parseLeaseConfig(lease.lease_terms) }
        })
      )
      setLeases(enriched)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const signLease = async () => {
    if (!signingLease || !termsAccepted) return
    try {
      const config = signingLease.config || {}
      const updatedConfig = {
        ...config,
        tenant_signed: true,
        tenant_signed_at: new Date().toISOString(),
      }

      // If landlord already signed, mark as fully signed
      const landlordSigned = (config as any).landlord_signed
      const updates: any = {
        lease_terms: JSON.stringify(updatedConfig),
      }

      if (landlordSigned) {
        updates.is_signed = true
        updates.signed_at = new Date().toISOString()
        // Don't activate yet - need move-in payment first
      }

      const { error } = await supabase.from("leases").update(updates).eq("id", signingLease.id)
      if (error) throw error

      setSigningLease(null)
      setTermsAccepted(false)
      fetchLeases()
    } catch (error) {
      console.error("Sign error:", error)
    }
  }

  const requestCancellation = async (leaseId: string) => {
    const cancellationDate = new Date()
    const effectiveDate = new Date()
    effectiveDate.setDate(effectiveDate.getDate() + NOTICE_DAYS)

    const lease = leases.find(l => l.id === leaseId)
    const config = lease?.config || {}
    const updatedConfig = {
      ...config,
      cancellation_notice_date: cancellationDate.toISOString(),
      cancellation_effective_date: effectiveDate.toISOString(),
      cancelled_by: "tenant",
    }

    const { error } = await supabase.from("leases").update({
      is_active: false,
      end_date: effectiveDate.toISOString().split("T")[0],
      lease_terms: JSON.stringify(updatedConfig),
    }).eq("id", leaseId)

    if (error) console.error("Cancel error:", error)
    fetchLeases()
  }

  const generatePDF = (lease: Lease) => {
    const config = lease.config
    const extrasHtml = (config?.extras || []).map(e =>
      `<tr><td style="padding:4px 0">${e.name}</td><td style="text-align:right">${formatCurrency(e.amount)}</td></tr>`
    ).join("")

    const doc = `<!DOCTYPE html><html><head><title>Lease - MyYard</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;line-height:1.6}h1{text-align:center;color:#ea580c}table{width:100%;border-collapse:collapse}td{padding:4px 0}.total{font-weight:bold;border-top:2px solid #333;padding-top:8px}.footer{text-align:center;color:#666;font-size:12px;margin-top:40px}</style></head><body>
<h1>RESIDENTIAL LEASE AGREEMENT</h1>
<p><strong>Property:</strong> ${lease.property?.title} - ${lease.property?.address}</p>
<p><strong>Landlord:</strong> ${lease.landlord?.first_name} ${lease.landlord?.last_name}</p>
<p><strong>Tenant:</strong> ${profile?.first_name} ${profile?.last_name}</p>
<p><strong>Term:</strong> ${new Date(lease.start_date).toLocaleDateString("en-ZA")} to ${new Date(lease.end_date).toLocaleDateString("en-ZA")}</p>
<h3>Monthly Payment</h3>
<table><tr><td>Base Rent</td><td style="text-align:right">${formatCurrency(lease.monthly_rent)}</td></tr>${extrasHtml}
<tr class="total"><td><strong>MONTHLY TOTAL</strong></td><td style="text-align:right"><strong>${formatCurrency(config?.monthly_total || lease.monthly_rent)}</strong></td></tr></table>
<h3>Move-In Cost</h3>
<table>${lease.deposit_amount > 0 ? `<tr><td>Deposit</td><td style="text-align:right">${formatCurrency(lease.deposit_amount)}</td></tr>` : ''}
<tr><td>First Month</td><td style="text-align:right">${formatCurrency(config?.monthly_total || lease.monthly_rent)}</td></tr>
<tr class="total"><td><strong>TOTAL MOVE-IN</strong></td><td style="text-align:right"><strong>${formatCurrency(config?.move_in_total || 0)}</strong></td></tr></table>
<h3>Cancellation</h3><p>${NOTICE_DAYS}+ days notice = No penalty. Less than ${NOTICE_DAYS} days = ${formatCurrency(CANCEL_PENALTY)} penalty.</p>
<div class="footer"><p>MyYard &copy; ${new Date().getFullYear()}</p></div></body></html>`

    const blob = new Blob([doc], { type: "text/html" })
    const pw = window.open(URL.createObjectURL(blob), "_blank")
    if (pw) pw.onload = () => pw.print()
  }

  const getLeaseStatus = (lease: Lease) => {
    const config = lease.config as any
    if (config?.cancellation_notice_date) return { label: "Cancellation Pending", color: "bg-red-100 text-red-800", icon: AlertTriangle }
    if (lease.is_active) return { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle }
    if (lease.is_signed) return { label: "Signed - Awaiting Payment", color: "bg-blue-100 text-blue-800", icon: CreditCard }
    if (config?.tenant_signed) return { label: "You Signed - Awaiting Landlord", color: "bg-yellow-100 text-yellow-800", icon: PenTool }
    if (config?.landlord_signed) return { label: "Landlord Signed - Your Turn", color: "bg-orange-100 text-orange-800", icon: PenTool }
    return { label: "Pending", color: "bg-gray-100 text-gray-800", icon: FileText }
  }

  const needsSignature = (lease: Lease) => {
    const config = lease.config as any
    return config?.landlord_signed && !config?.tenant_signed
  }

  const needsPayment = (lease: Lease) => {
    return lease.is_signed && !lease.is_active
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardHeader><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader></Card>)}</div>
  }

  return (
    <div className="space-y-6" data-testid="tenant-leases-page">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" data-testid="tenant-leases-title">My Leases</h2>
        <p className="text-gray-600">View, sign and manage your lease agreements</p>
      </div>

      {leases.length > 0 ? (
        <div className="space-y-4">
          {leases.map((lease) => {
            const status = getLeaseStatus(lease)
            const config = lease.config
            const StatusIcon = status.icon

            return (
              <Card key={lease.id} data-testid={`tenant-lease-${lease.id}`} className={needsSignature(lease) || needsPayment(lease) ? "border-orange-300 bg-orange-50/30" : ""}>
                <CardContent className="p-6">
                  {/* Action Banner */}
                  {needsSignature(lease) && (
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">Lease invitation from {lease.landlord?.first_name} {lease.landlord?.last_name}. Review and sign to proceed.</span>
                      <Button size="sm" onClick={() => { setSigningLease(lease); setTermsAccepted(false) }} data-testid={`review-sign-${lease.id}`}>
                        <PenTool className="h-4 w-4 mr-1" />Review & Sign
                      </Button>
                    </div>
                  )}

                  {needsPayment(lease) && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-blue-800 flex items-center gap-1"><Home className="h-4 w-4" /> Complete your move-in payment to activate your lease</span>
                        <span className="text-lg font-bold text-blue-900 block mt-1">{formatCurrency(config?.move_in_total || 0)} due</span>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setPayingLease(lease)} data-testid={`pay-movein-${lease.id}`}>
                        <CreditCard className="h-4 w-4 mr-1" />Pay to Move In
                      </Button>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">{lease.property?.title}</h3>
                        <Badge className={status.color}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{lease.property?.address}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" />Landlord: {lease.landlord?.first_name} {lease.landlord?.last_name}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}</span>
                      </div>

                      {/* Pricing Breakdown */}
                      {config && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2 text-sm space-y-1">
                          <div className="flex justify-between"><span>Base Rent</span><span className="font-medium">{formatCurrency(lease.monthly_rent)}</span></div>
                          {config.extras?.map(e => (
                            <div key={e.id} className="flex justify-between"><span>{e.name}</span><span className="font-medium">{formatCurrency(e.amount)}</span></div>
                          ))}
                          <Separator className="my-1" />
                          <div className="flex justify-between font-bold"><span>Monthly Total</span><span>{formatCurrency(config.monthly_total)}</span></div>
                          {config.deposit_required && (
                            <div className="flex justify-between text-gray-500 text-xs"><span>Deposit</span><span>{formatCurrency(lease.deposit_amount)}</span></div>
                          )}
                        </div>
                      )}

                      {(lease.config as any)?.cancellation_notice_date && (
                        <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          Cancellation effective {new Date(lease.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => generatePDF(lease)}>
                        <Download className="h-4 w-4 mr-1" />PDF
                      </Button>
                      {lease.is_active && !(lease.config as any)?.cancellation_notice_date && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => requestCancellation(lease.id)}>
                          <Ban className="h-4 w-4 mr-1" />Cancel (20-day)
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
          <p className="text-gray-600">Your lease invitations will appear here</p>
        </CardContent></Card>
      )}

      {/* SIGN LEASE DIALOG */}
      <Dialog open={!!signingLease} onOpenChange={() => { setSigningLease(null); setTermsAccepted(false) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lease Invitation</DialogTitle>
            <DialogDescription>Review the terms carefully before signing</DialogDescription>
          </DialogHeader>
          {signingLease && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="font-semibold">{signingLease.property?.title}</p>
                <p className="text-sm text-gray-600">{signingLease.property?.address}</p>
                <p className="text-sm">Type: {signingLease.property?.property_type} | Landlord: {signingLease.landlord?.first_name} {signingLease.landlord?.last_name}</p>
              </div>

              <Separator />

              <div>
                <p className="font-semibold text-sm mb-1">LEASE TERMS</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Duration</span><span>{signingLease.config?.duration_months} months</span></div>
                  <div className="flex justify-between"><span>Start</span><span>{new Date(signingLease.start_date).toLocaleDateString("en-ZA")}</span></div>
                  <div className="flex justify-between"><span>End</span><span>{new Date(signingLease.end_date).toLocaleDateString("en-ZA")}</span></div>
                  <div className="flex justify-between"><span>Rent Due</span><span>{signingLease.config?.rent_due_day}{signingLease.config?.rent_due_day === 1 ? 'st' : 'th'} of each month</span></div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-semibold text-sm mb-1">MONTHLY BREAKDOWN</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Base Rent</span><span>{formatCurrency(signingLease.monthly_rent)} <Lock className="inline h-3 w-3 text-gray-400" /></span></div>
                  {signingLease.config?.extras?.map(e => (
                    <div key={e.id} className="flex justify-between"><span>{e.name}</span><span>{formatCurrency(e.amount)} <Lock className="inline h-3 w-3 text-gray-400" /></span></div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold"><span>Monthly Total</span><span>{formatCurrency(signingLease.config?.monthly_total || signingLease.monthly_rent)}</span></div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <p className="font-bold text-sm mb-2">MOVE-IN COST</p>
                <div className="text-sm space-y-1">
                  {signingLease.config?.deposit_required && (
                    <div className="flex justify-between"><span>Deposit</span><span>{formatCurrency(signingLease.deposit_amount)}</span></div>
                  )}
                  <div className="flex justify-between"><span>First Month Rent</span><span>{formatCurrency(signingLease.monthly_rent)}</span></div>
                  {signingLease.config?.extras?.map(e => (
                    <div key={e.id} className="flex justify-between"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-green-800 text-lg">
                    <span>TOTAL TO MOVE IN</span>
                    <span>{formatCurrency(signingLease.config?.move_in_total || 0)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This amount is due upon signing the lease.</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-red-800 mb-1">CANCELLATION POLICY</p>
                <ul className="space-y-1 text-red-700">
                  <li>{NOTICE_DAYS}+ days notice before month end = No penalty</li>
                  <li>Less than {NOTICE_DAYS} days = {formatCurrency(CANCEL_PENALTY)} penalty</li>
                  <li>Penalty deducted from deposit (if applicable)</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v as boolean)} id="accept-terms" />
                <Label htmlFor="accept-terms" className="text-sm">I have read and agree to all terms</Label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSigningLease(null)}>Decline</Button>
                <Button onClick={signLease} disabled={!termsAccepted} data-testid="confirm-sign-lease">
                  <PenTool className="h-4 w-4 mr-1" />Sign Lease
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MOVE-IN PAYMENT DIALOG */}
      <Dialog open={!!payingLease} onOpenChange={() => setPayingLease(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-blue-600" />Welcome to your new home!</DialogTitle>
            <DialogDescription>Complete your move-in payment to activate your lease.</DialogDescription>
          </DialogHeader>
          {payingLease && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-gray-600">
                <p className="font-medium">{payingLease.property?.title}</p>
                <p>Starting: {new Date(payingLease.start_date).toLocaleDateString("en-ZA")}</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {payingLease.config?.deposit_required && (
                  <div className="flex justify-between"><span>Deposit</span><span>{formatCurrency(payingLease.deposit_amount)}</span></div>
                )}
                <div className="flex justify-between"><span>{new Date(payingLease.start_date).toLocaleString("en-ZA", { month: "long", year: "numeric" })} Rent</span><span>{formatCurrency(payingLease.monthly_rent)}</span></div>
                {payingLease.config?.extras?.map(e => (
                  <div key={e.id} className="flex justify-between"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL DUE</span>
                  <span className="text-blue-700">{formatCurrency(payingLease.config?.move_in_total || 0)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                onClick={() => {
                  alert("Ozow payment integration coming soon! Your landlord will be notified about the pending payment.")
                  setPayingLease(null)
                }}
                data-testid="pay-movein-confirm"
              >
                Pay {formatCurrency(payingLease.config?.move_in_total || 0)} Now
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="h-3 w-3" />
                <span>Secured by Ozow</span>
              </div>

              <p className="text-xs text-center text-gray-500">Lease activates after payment. Cannot pay partial amount.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
