"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, Save, AlertTriangle, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface TenantProfile {
  id: string
  date_of_birth: string | null
  id_number: string | null
  current_address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  employment_status: string | null
  employer_name: string | null
  job_title: string | null
  monthly_income: number | null
  employment_duration_months: number | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  previous_address: string | null
  reason_for_moving: string | null
  preferred_move_in_date: string | null
  max_rent_budget: number | null
  preferred_property_type: string | null
  pets: boolean | null
  pet_details: string | null
  smoking: boolean | null
  additional_notes: string | null
}

interface LeaseTerminationRequest {
  lease_id: string
  termination_date: string
  reason: string
  notice_period_days: number
}

export default function TenantSettingsPage() {
  const { profile } = useAuth()
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showTerminationDialog, setShowTerminationDialog] = useState(false)
  const [terminationRequest, setTerminationRequest] = useState<LeaseTerminationRequest>({
    lease_id: "",
    termination_date: "",
    reason: "",
    notice_period_days: 30,
  })
  const [activeLeases, setActiveLeases] = useState<any[]>([])
  const [personalData, setPersonalData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (profile?.id) {
      setPersonalData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      })
      fetchTenantProfile()
      fetchActiveLeases()
    }
  }, [profile?.id])

  const fetchTenantProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("id", profile?.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching tenant profile:", error)
        return
      }

      setTenantProfile(
        data || {
          id: profile?.id,
          date_of_birth: null,
          id_number: null,
          current_address: null,
          city: null,
          province: null,
          postal_code: null,
          employment_status: null,
          employer_name: null,
          job_title: null,
          monthly_income: null,
          employment_duration_months: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          emergency_contact_relationship: null,
          previous_address: null,
          reason_for_moving: null,
          preferred_move_in_date: null,
          max_rent_budget: null,
          preferred_property_type: null,
          pets: null,
          pet_details: null,
          smoking: null,
          additional_notes: null,
        },
      )
    } catch (error) {
      console.error("Error fetching tenant profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveLeases = async () => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id, start_date, end_date, monthly_rent,
          property:properties(title, address)
        `)
        .eq("tenant_id", profile?.id)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching active leases:", error instanceof Error ? error.message : JSON.stringify(error))
        return
      }

      setActiveLeases(data || [])
    } catch (error) {
      console.error("Error fetching active leases:", error instanceof Error ? error.message : JSON.stringify(error))
    }
  }

  const handleProfileUpdate = (field: keyof TenantProfile, value: any) => {
    setTenantProfile((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const saveProfile = async () => {
    if (!tenantProfile) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: personalData.first_name,
          last_name: personalData.last_name,
          phone: personalData.phone,
        })
        .eq("id", profile?.id)

      if (profileError) throw profileError

      const { error: tenantError } = await supabase
        .from("tenant_profiles")
        .upsert(tenantProfile, { onConflict: "id" })

      if (tenantError) throw tenantError

      // Refetch to verify the save
      await fetchTenantProfile()

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving your profile")
    } finally {
      setSaving(false)
    }
  }

  const submitTerminationRequest = async () => {
    if (!terminationRequest.lease_id || !terminationRequest.termination_date || !terminationRequest.reason) {
      setError("Please fill in all required fields for the termination request")
      return
    }

    try {
      const { error } = await supabase.from("lease_termination_requests").insert({
        lease_id: terminationRequest.lease_id,
        tenant_id: profile?.id,
        requested_termination_date: terminationRequest.termination_date,
        reason: terminationRequest.reason,
        notice_period_days: terminationRequest.notice_period_days,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setSuccess("Lease termination request submitted successfully!")
      setShowTerminationDialog(false)
      setTerminationRequest({
        lease_id: "",
        termination_date: "",
        reason: "",
        notice_period_days: 30,
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your termination request")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your profile and account preferences</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={personalData.first_name}
                onChange={(e) => setPersonalData((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={personalData.last_name}
                onChange={(e) => setPersonalData((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={personalData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={personalData.phone}
                onChange={(e) => setPersonalData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={tenantProfile?.date_of_birth || ""}
                onChange={(e) => handleProfileUpdate("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_number">ID Number</Label>
              <Input
                id="id_number"
                value={tenantProfile?.id_number || ""}
                onChange={(e) => handleProfileUpdate("id_number", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Your current and previous addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_address">Current Address</Label>
              <Textarea
                id="current_address"
                value={tenantProfile?.current_address || ""}
                onChange={(e) => handleProfileUpdate("current_address", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_address">Previous Address</Label>
              <Textarea
                id="previous_address"
                value={tenantProfile?.previous_address || ""}
                onChange={(e) => handleProfileUpdate("previous_address", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={tenantProfile?.city || ""}
                onChange={(e) => handleProfileUpdate("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={tenantProfile?.province || ""}
                onValueChange={(value) => handleProfileUpdate("province", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gauteng">Gauteng</SelectItem>
                  <SelectItem value="western-cape">Western Cape</SelectItem>
                  <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="eastern-cape">Eastern Cape</SelectItem>
                  <SelectItem value="free-state">Free State</SelectItem>
                  <SelectItem value="limpopo">Limpopo</SelectItem>
                  <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem value="north-west">North West</SelectItem>
                  <SelectItem value="northern-cape">Northern Cape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
          <CardDescription>Your employment and income details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment Status</Label>
              <Select
                value={tenantProfile?.employment_status || ""}
                onValueChange={(value) => handleProfileUpdate("employment_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income (R)</Label>
              <Input
                id="monthly_income"
                type="number"
                value={tenantProfile?.monthly_income || ""}
                onChange={(e) => handleProfileUpdate("monthly_income", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employer_name">Employer Name</Label>
              <Input
                id="employer_name"
                value={tenantProfile?.employer_name || ""}
                onChange={(e) => handleProfileUpdate("employer_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={tenantProfile?.job_title || ""}
                onChange={(e) => handleProfileUpdate("job_title", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Someone we can contact in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={tenantProfile?.emergency_contact_name || ""}
                onChange={(e) => handleProfileUpdate("emergency_contact_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={tenantProfile?.emergency_contact_phone || ""}
                onChange={(e) => handleProfileUpdate("emergency_contact_phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input
                id="emergency_contact_relationship"
                value={tenantProfile?.emergency_contact_relationship || ""}
                onChange={(e) => handleProfileUpdate("emergency_contact_relationship", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lease Management */}
      {activeLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Lease Management
            </CardTitle>
            <CardDescription>Manage your active leases and submit termination requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {activeLeases.map((lease) => (
                <div key={lease.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{lease.property.title}</h4>
                    <p className="text-sm text-gray-600">{lease.property.address}</p>
                    <p className="text-sm text-gray-500">
                      R{lease.monthly_rent.toLocaleString()}/month • Ends{" "}
                      {new Date(lease.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Active
                  </Badge>
                </div>
              ))}
            </div>

            <Dialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Request Lease Termination
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Lease Termination</DialogTitle>
                  <DialogDescription>
                    Submit a request to terminate your lease. Standard notice period is 30 days.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lease_select">Select Lease</Label>
                    <Select
                      value={terminationRequest.lease_id}
                      onValueChange={(value) => setTerminationRequest((prev) => ({ ...prev, lease_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lease to terminate" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLeases.map((lease) => (
                          <SelectItem key={lease.id} value={lease.id}>
                            {lease.property.title} - R{lease.monthly_rent.toLocaleString()}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termination_date">Requested Termination Date</Label>
                    <Input
                      id="termination_date"
                      type="date"
                      value={terminationRequest.termination_date}
                      onChange={(e) => setTerminationRequest((prev) => ({ ...prev, termination_date: e.target.value }))}
                      min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termination_reason">Reason for Termination</Label>
                    <Textarea
                      id="termination_reason"
                      value={terminationRequest.reason}
                      onChange={(e) => setTerminationRequest((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="Please explain why you need to terminate the lease..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowTerminationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={submitTerminationRequest}>Submit Request</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
