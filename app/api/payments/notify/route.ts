import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ozowService } from "@/lib/ozow"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook hash
    if (!ozowService.verifyWebhookHash(body)) {
      console.error("Invalid webhook hash")
      return NextResponse.json({ error: "Invalid hash" }, { status: 403 })
    }

    const {
      TransactionReference,
      Status,
      StatusMessage,
      Amount,
      Optional1: userId,
      Optional2: paymentType,
    } = body

    // Find payment by transaction reference
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", TransactionReference)
      .single()

    if (!payment) {
      console.error("Payment not found:", TransactionReference)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Map Ozow status to our status
    let newStatus = "pending"
    if (Status === "Complete" || Status === "Successful") {
      newStatus = "completed"
    } else if (Status === "Cancelled") {
      newStatus = "cancelled"
    } else if (Status === "Error" || Status === "Failed") {
      newStatus = "failed"
    }

    // Update payment
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        ozow_status: Status,
        ozow_status_message: StatusMessage,
        payment_date: new Date().toISOString(),
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    if (updateError) throw updateError

    // Create notification for user
    if (newStatus === "completed") {
      await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: "payment",
        title: "Payment Successful",
        message: `Your ${payment.type.replace("_", " ")} payment of R${(payment.total_amount / 100).toFixed(2)} was successful`,
        link: `/payments/${payment.id}`,
        metadata: { payment_id: payment.id },
      })

      // Notify landlord if applicable
      if (payment.property_id) {
        const { data: property } = await supabase
          .from("properties")
          .select("landlord_id")
          .eq("id", payment.property_id)
          .single()

        if (property?.landlord_id) {
          await supabase.from("notifications").insert({
            user_id: property.landlord_id,
            type: "payment",
            title: "Payment Received",
            message: `Tenant payment of R${(payment.total_amount / 100).toFixed(2)} received`,
            link: `/landlord/payments/${payment.id}`,
            metadata: { payment_id: payment.id },
          })
        }
      }
    } else if (newStatus === "failed" || newStatus === "cancelled") {
      await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: "payment",
        title: "Payment Failed",
        message: `Your payment was ${newStatus}. ${StatusMessage}`,
        link: `/payments/${payment.id}`,
        metadata: { payment_id: payment.id },
      })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error("Payment webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint" })
}
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
      Status, paymentType, leaseId, OZOW_PRIVATE_KEY
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
