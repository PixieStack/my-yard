"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Upload, File, Download, Check, AlertCircle, Loader2 } from "lucide-react"

interface Payment {
  id: string
  lease_id: string
  tenant_id: string
  amount: number
  type: string
  status: string
  created_at: string
  updated_at: string
}

interface PaymentReceipt {
  id: string
  payment_id: string
  receipt_url: string
  created_at: string
}

interface PaymentReceiptsProps {
  payment: Payment
  receipts: PaymentReceipt[]
  onReceiptAdded: (receipt: PaymentReceipt) => void
}

export function PaymentReceipts({ payment, receipts, onReceiptAdded }: PaymentReceiptsProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileUpload = async (file: File) => {
    if (!file) return

    try {
      setUploading(true)
      setError("")
      setSuccess("")

      // Upload to storage
      const fileName = `receipts/${payment.id}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(uploadData.path)

      // Create receipt record
      const { data: receipt, error: insertError } = await supabase
        .from("payment_receipts")
        .insert({
          payment_id: payment.id,
          receipt_url: urlData.publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      onReceiptAdded(receipt)
      setSuccess("Receipt uploaded successfully!")
    } catch (err) {
      console.error("Error uploading receipt:", err instanceof Error ? err.message : String(err))
      setError(err instanceof Error ? err.message : "Failed to upload receipt")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Receipts</CardTitle>
        <CardDescription>
          Upload proof of payment to complete this transaction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-4">
          {receipts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Uploaded Receipts</h4>
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Receipt uploaded{" "}
                        {new Date(receipt.created_at).toLocaleDateString("en-ZA")}
                      </p>
                      <Badge className="mt-1 bg-green-100 text-green-800">Verified</Badge>
                    </div>
                  </div>
                  <a
                    href={receipt.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
              id="receipt-upload"
              accept="image/*,.pdf"
              disabled={uploading}
            />
            <label htmlFor="receipt-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Upload Receipt</p>
              <p className="text-xs text-gray-600 mt-1">
                Click to select image or PDF (max 10MB)
              </p>
            </label>
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading receipt...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
