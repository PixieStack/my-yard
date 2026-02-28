"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Loader2, Check, AlertCircle } from "lucide-react"

interface BankingDetails {
  id: string
  landlord_id: string
  bank_name: string
  account_number: string
  account_holder_name: string
  account_type: string
  created_at: string
  updated_at: string
}

export default function LandlordBankingDetailsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null)

  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    account_type: "CHEQUE",
  })

  useEffect(() => {
    fetchBankingDetails()
  }, [profile?.id])

  const fetchBankingDetails = async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from("landlord_banking_details")
        .select("*")
        .eq("landlord_id", profile.id)
        .maybeSingle()

      if (err) throw err

      if (data) {
        setBankingDetails(data)
        setFormData({
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder_name: data.account_holder_name,
          account_type: data.account_type,
        })
      }
    } catch (err) {
      console.error("Error fetching banking details:", err instanceof Error ? err.message : String(err))
      setError("Failed to load banking details")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile?.id) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (bankingDetails) {
        // Update existing
        const { error: err } = await supabase
          .from("landlord_banking_details")
          .update({
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            account_holder_name: formData.account_holder_name,
            account_type: formData.account_type,
            updated_at: new Date().toISOString(),
          })
          .eq("landlord_id", profile.id)

        if (err) throw err
        setSuccess("Banking details updated successfully!")
      } else {
        // Create new
        const { data, error: err } = await supabase
          .from("landlord_banking_details")
          .insert({
            landlord_id: profile.id,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            account_holder_name: formData.account_holder_name,
            account_type: formData.account_type,
          })
          .select()
          .single()

        if (err) throw err
        setBankingDetails(data)
        setSuccess("Banking details saved successfully!")
      }

      // Refresh
      await fetchBankingDetails()
    } catch (err) {
      console.error("Error saving banking details:", err instanceof Error ? err.message : String(err))
      setError(err instanceof Error ? err.message : "Failed to save banking details")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Banking Details</h1>
        <p className="text-gray-600 mt-2">
          Add your bank account details so tenants can pay deposits and rent to you
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Enter your banking details securely. This information is only used for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                placeholder="e.g., Capitec, FNB, ABSA"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger id="account_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEQUE">Cheque Account</SelectItem>
                  <SelectItem value="SAVINGS">Savings Account</SelectItem>
                  <SelectItem value="TRANSMISSION">Transmission Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder">Account Holder Name</Label>
              <Input
                id="account_holder"
                placeholder="Full name on bank account"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                placeholder="Enter account number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
            </div>
          </div>

          {bankingDetails && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Last updated: {new Date(bankingDetails.updated_at).toLocaleDateString("en-ZA")}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Banking Details
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">Security Note</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-800 space-y-2">
          <p>✓ Your banking details are encrypted and stored securely</p>
          <p>✓ Only used for receiving tenant payments and deposits</p>
          <p>✓ You can update your banking details at any time</p>
          <p>✓ Never share your banking details with tenants directly</p>
        </CardContent>
      </Card>
    </div>
  )
}
