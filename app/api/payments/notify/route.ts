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
