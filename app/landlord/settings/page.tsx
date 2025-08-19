"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Building, Bell, Shield, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface LandlordProfile {
  business_name: string
  business_registration_number: string
  tax_number: string
  years_experience: number
  accepts_pets: boolean
  allows_smoking: boolean
  preferred_tenant_type: string
  minimum_lease_months: number
  response_time_hours: number
}

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [personalData, setPersonalData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const [landlordData, setLandlordData] = useState<LandlordProfile>({
    business_name: "",
    business_registration_number: "",
    tax_number: "",
    years_experience: 0,
    accepts_pets: false,
    allows_smoking: false,
    preferred_tenant_type: "any",
    minimum_lease_months: 6,
    response_time_hours: 24,
  })

  const [notifications, setNotifications] = useState({
    email_applications: true,
    email_payments: true,
    email_maintenance: true,
    sms_urgent: false,
  })

  useEffect(() => {
    if (profile) {
      setPersonalData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      })
      fetchLandlordProfile()
    }
  }, [profile])

  const fetchLandlordProfile = async () => {
    try {
      const { data } = await supabase.from("landlord_profiles").select("*").eq("id", profile?.id).single()

      if (data) {
        setLandlordData({
          business_name: data.business_name || "",
          business_registration_number: data.business_registration_number || "",
          tax_number: data.tax_number || "",
          years_experience: data.years_experience || 0,
          accepts_pets: data.accepts_pets || false,
          allows_smoking: data.allows_smoking || false,
          preferred_tenant_type: data.preferred_tenant_type || "any",
          minimum_lease_months: data.minimum_lease_months || 6,
          response_time_hours: data.response_time_hours || 24,
        })
      }
    } catch (error) {
      console.error("Error fetching landlord profile:", error)
    }
  }

  const updatePersonalInfo = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: personalData.first_name,
          last_name: personalData.last_name,
          phone: personalData.phone,
        })
        .eq("id", profile?.id)

      if (error) throw error

      setSuccess("Personal information updated successfully")
      updateProfile()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateLandlordProfile = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.from("landlord_profiles").upsert({
        id: profile?.id,
        ...landlordData,
      })

      if (error) throw error

      setSuccess("Business information updated successfully")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your account and preferences</p>
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

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={personalData.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={updatePersonalInfo} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Information */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>Manage your business details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={landlordData.business_name}
                    onChange={(e) => setLandlordData((prev) => ({ ...prev, business_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    value={landlordData.years_experience}
                    onChange={(e) =>
                      setLandlordData((prev) => ({ ...prev, years_experience: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_registration">Business Registration Number</Label>
                  <Input
                    id="business_registration"
                    value={landlordData.business_registration_number}
                    onChange={(e) =>
                      setLandlordData((prev) => ({ ...prev, business_registration_number: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax Number</Label>
                  <Input
                    id="tax_number"
                    value={landlordData.tax_number}
                    onChange={(e) => setLandlordData((prev) => ({ ...prev, tax_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Property Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="accepts_pets">Accept Pets</Label>
                    <Switch
                      id="accepts_pets"
                      checked={landlordData.accepts_pets}
                      onCheckedChange={(checked) => setLandlordData((prev) => ({ ...prev, accepts_pets: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allows_smoking">Allow Smoking</Label>
                    <Switch
                      id="allows_smoking"
                      checked={landlordData.allows_smoking}
                      onCheckedChange={(checked) => setLandlordData((prev) => ({ ...prev, allows_smoking: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={updateLandlordProfile} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_applications">Email - New Applications</Label>
                    <p className="text-sm text-gray-500">Get notified when tenants apply for your properties</p>
                  </div>
                  <Switch
                    id="email_applications"
                    checked={notifications.email_applications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, email_applications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_payments">Email - Payment Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about payment status changes</p>
                  </div>
                  <Switch
                    id="email_payments"
                    checked={notifications.email_payments}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email_payments: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_maintenance">Email - Maintenance Requests</Label>
                    <p className="text-sm text-gray-500">Get notified about maintenance requests</p>
                  </div>
                  <Switch
                    id="email_maintenance"
                    checked={notifications.email_maintenance}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email_maintenance: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms_urgent">SMS - Urgent Notifications</Label>
                    <p className="text-sm text-gray-500">Get SMS for urgent matters only</p>
                  </div>
                  <Switch
                    id="sms_urgent"
                    checked={notifications.sms_urgent}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms_urgent: checked }))}
                  />
                </div>
              </div>

              <Button disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Change Password</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    To change your password, you'll need to reset it through the login page.
                  </p>
                  <Button variant="outline">Reset Password</Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account Deletion</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
