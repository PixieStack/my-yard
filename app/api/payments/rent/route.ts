import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { ozowService } from "@/lib/ozow"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { userId, propertyId, leaseId, rentAmount, utilitiesAmount } = body

    if (!userId || !propertyId || !rentAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get user details
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    // Get property details
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single()

    if (!user || !property) {
      return NextResponse.json(
        { error: "User or property not found" },
        { status: 404 }
      )
    }

    const totalAmount = rentAmount + (utilitiesAmount || 0)
    const transactionId = uuidv4()

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        transaction_id: transactionId,
        user_id: userId,
        property_id: propertyId,
        lease_id: leaseId,
        type: "monthly_rent",
        status: "pending",
        rent_amount: rentAmount,
        utilities_amount: utilitiesAmount || 0,
        total_amount: totalAmount,
        description: `Monthly rent for ${property.title}`,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Generate Ozow payment URL
    const ozowPayment = ozowService.createRentPayment({
      transactionId,
      userId,
      userEmail: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      propertyTitle: property.title,
      rentAmount,
      utilitiesAmount: utilitiesAmount || 0,
    })

    // Update payment with Ozow details
    await supabase
      .from("payments")
      .update({
        ozow_site_code: ozowPayment.request.siteCode,
        ozow_transaction_reference: ozowPayment.request.transactionReference,
        ozow_hash: ozowPayment.hash,
      })
      .eq("id", payment.id)

    return NextResponse.json({
      payment,
      paymentUrl: ozowPayment.url,
      breakdown: {
        rent: rentAmount,
        utilities: utilitiesAmount || 0,
        total: totalAmount,
      },
    })
  } catch (error: any) {
    console.error("Rent payment error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
