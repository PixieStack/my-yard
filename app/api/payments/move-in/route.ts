import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { ozowService } from "@/lib/ozow"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const {
      userId,
      propertyId,
      leaseId,
      depositAmount,
      rentAmount,
      utilitiesAmount,
    } = body

    if (!userId || !propertyId || !depositAmount || !rentAmount) {
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

    // Calculate admin fee
    const adminFee = ozowService.calculateAdminFee(rentAmount)
    const totalAmount = depositAmount + rentAmount + (utilitiesAmount || 0) + adminFee

    // Create transaction ID
    const transactionId = uuidv4()

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        transaction_id: transactionId,
        user_id: userId,
        property_id: propertyId,
        lease_id: leaseId,
        type: "move_in",
        status: "pending",
        deposit_amount: depositAmount,
        rent_amount: rentAmount,
        utilities_amount: utilitiesAmount || 0,
        admin_fee_amount: adminFee,
        total_amount: totalAmount,
        description: `Move-in payment for ${property.title}`,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Generate Ozow payment URL
    const ozowPayment = ozowService.createMoveInPayment({
      transactionId,
      userId,
      userEmail: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      propertyTitle: property.title,
      depositAmount,
      rentAmount,
      utilitiesAmount: utilitiesAmount || 0,
      adminFee,
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
        deposit: depositAmount,
        rent: rentAmount,
        utilities: utilitiesAmount || 0,
        adminFee,
        total: totalAmount,
      },
    })
  } catch (error: any) {
    console.error("Move-in payment error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
