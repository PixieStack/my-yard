import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import crypto from "crypto"

const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || ""

// POST /api/payments/notify - Ozow webhook callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      SiteCode, TransactionId, TransactionReference, Amount,
      Status, StatusMessage, HashCheck,
      Optional1: paymentType, Optional2: leaseId,
    } = body

    // Verify hash
    const hashInput = [
      SiteCode, TransactionId, TransactionReference, Amount,
      Status, Optional1, Optional2, OZOW_PRIVATE_KEY
    ].join("").toLowerCase()
    const expectedHash = crypto.createHash("sha512").update(hashInput).digest("hex")

    if (HashCheck && OZOW_PRIVATE_KEY && HashCheck.toLowerCase() !== expectedHash) {
      return NextResponse.json({ error: "Hash verification failed" }, { status: 403 })
    }

    const supabase = createClient()
    const ozowStatus = Status?.toLowerCase()
    let dbStatus = "pending"

    if (ozowStatus === "complete") dbStatus = "complete"
    else if (ozowStatus === "cancelled") dbStatus = "cancelled"
    else if (ozowStatus === "error") dbStatus = "error"
    else if (ozowStatus === "abandoned") dbStatus = "cancelled"

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: dbStatus,
        paid_date: dbStatus === "complete" ? new Date().toISOString().split("T")[0] : null,
        payment_method: "ozow",
      })
      .eq("transaction_reference", TransactionReference)

    if (updateError) {
      console.error("Payment update error:", updateError)
    }

    // If payment complete, update lease status
    if (dbStatus === "complete" && leaseId) {
      if (paymentType === "move_in") {
        await supabase.from("leases").update({
          is_active: true,
        }).eq("id", leaseId)

        // Update property status
        const { data: lease } = await supabase.from("leases").select("property_id").eq("id", leaseId).maybeSingle()
        if (lease?.property_id) {
          await supabase.from("properties").update({ status: "occupied" }).eq("id", lease.property_id)
        }
      }
    }

    return NextResponse.json({ success: true, status: dbStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
