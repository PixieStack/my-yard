import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { parseLeaseConfig, formatCurrency, ADMIN_FEE, CANCEL_PENALTY, NOTICE_DAYS } from "@/lib/lease-utils"
import crypto from "crypto"

const OZOW_API_KEY = process.env.OZOW_API_KEY || ""
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || ""
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || ""
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ""
const OZOW_ENABLED = process.env.NEXT_PUBLIC_OZOW_ENABLED === "true"

function generateTransactionRef(type: string, leaseId: string): string {
  return `${type.toUpperCase()}-${Date.now()}-${leaseId.slice(0, 8)}`
}

function generateOzowHash(params: Record<string, string>): string {
  const hashInput = Object.values(params).join("") + OZOW_PRIVATE_KEY
  return crypto.createHash("sha512").update(hashInput.toLowerCase()).digest("hex")
}

// POST /api/payments/ozow
// Handles all payment types: move_in, monthly_rent, admin_fee, cancel_penalty, deposit_return
export async function POST(request: NextRequest) {
  try {
    if (!OZOW_ENABLED || OZOW_API_KEY.startsWith("PLACEHOLDER")) {
      return NextResponse.json(
        { error: "Ozow payments not yet configured. Please contact administrator." },
        { status: 503 }
      )
    }

    const supabase = createClient()
    const body = await request.json()
    const { payment_type, lease_id, user_id } = body

    if (!payment_type || !lease_id || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: payment_type, lease_id, user_id" },
        { status: 400 }
      )
    }

    // Fetch lease and verify
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*")
      .eq("id", lease_id)
      .maybeSingle()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 })
    }

    const config = parseLeaseConfig(lease.lease_terms)
    let amount = 0
    let description = ""
    let fromUserId = ""
    let toUserId = ""

    switch (payment_type) {
      case "move_in":
        // Server-side calculation: deposit + first month + extras
        if (lease.tenant_id !== user_id) {
          return NextResponse.json({ error: "Only the tenant can make move-in payments" }, { status: 403 })
        }
        amount = config?.move_in_total || (lease.deposit_amount + lease.monthly_rent)
        description = `Move-in payment for ${lease_id.slice(0, 8)}`
        fromUserId = lease.tenant_id
        toUserId = lease.landlord_id
        break

      case "monthly_rent":
        if (lease.tenant_id !== user_id) {
          return NextResponse.json({ error: "Only the tenant can pay rent" }, { status: 403 })
        }
        amount = config?.monthly_total || lease.monthly_rent
        description = `Monthly rent for ${lease_id.slice(0, 8)}`
        fromUserId = lease.tenant_id
        toUserId = lease.landlord_id
        break

      case "admin_fee":
        if (lease.landlord_id !== user_id) {
          return NextResponse.json({ error: "Only the landlord pays the admin fee" }, { status: 403 })
        }
        amount = ADMIN_FEE
        description = `Admin fee for lease ${lease_id.slice(0, 8)}`
        fromUserId = lease.landlord_id
        toUserId = "PLATFORM"
        break

      case "cancel_penalty":
        if (lease.tenant_id !== user_id) {
          return NextResponse.json({ error: "Only the tenant pays cancellation penalty" }, { status: 403 })
        }
        amount = CANCEL_PENALTY
        description = `Cancellation penalty for ${lease_id.slice(0, 8)}`
        fromUserId = lease.tenant_id
        toUserId = lease.landlord_id
        break

      default:
        return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 })
    }

    const transactionRef = generateTransactionRef(payment_type, lease_id)

    // Create payment record in DB
    const { error: paymentError } = await supabase.from("payments").insert({
      lease_id: lease_id,
      tenant_id: payment_type === "admin_fee" ? lease.tenant_id : lease.tenant_id,
      landlord_id: lease.landlord_id,
      property_id: lease.property_id,
      amount,
      payment_type,
      status: "pending",
      due_date: new Date().toISOString().split("T")[0],
      transaction_reference: transactionRef,
    })

    if (paymentError) {
      console.error("Payment record error:", paymentError)
    }

    // Build Ozow request
    const ozowParams = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: amount.toFixed(2),
      TransactionReference: transactionRef,
      BankReference: description,
      Optional1: payment_type,
      Optional2: lease_id,
      Optional3: fromUserId,
      Optional4: toUserId,
      SuccessUrl: `${APP_URL}/payments/success?ref=${transactionRef}&type=${payment_type}`,
      ErrorUrl: `${APP_URL}/payments/error?ref=${transactionRef}&type=${payment_type}`,
      CancelUrl: `${APP_URL}/payments/cancel?ref=${transactionRef}&type=${payment_type}`,
      NotifyUrl: `${APP_URL}/api/payments/notify`,
      IsTest: "true",
    }

    const hashCheck = generateOzowHash(ozowParams)

    return NextResponse.json({
      success: true,
      payment: {
        transaction_ref: transactionRef,
        amount,
        payment_type,
        description,
        breakdown: payment_type === "move_in" ? {
          deposit: config?.deposit_required ? lease.deposit_amount : null,
          base_rent: lease.monthly_rent,
          extras: config?.extras || [],
          total: amount,
        } : payment_type === "monthly_rent" ? {
          base_rent: lease.monthly_rent,
          extras: config?.extras || [],
          total: amount,
        } : {
          total: amount,
        },
      },
      ozow: {
        ...ozowParams,
        HashCheck: hashCheck,
        redirect_url: `https://pay.ozow.com/?${new URLSearchParams({ ...ozowParams, HashCheck: hashCheck }).toString()}`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/payments/ozow?lease_id=X&type=move_in - Get payment details for a lease
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const leaseId = searchParams.get("lease_id")
    const paymentType = searchParams.get("type") || "move_in"

    if (!leaseId) {
      return NextResponse.json({ error: "lease_id required" }, { status: 400 })
    }

    const { data: lease } = await supabase.from("leases").select("*").eq("id", leaseId).maybeSingle()
    if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 })

    const config = parseLeaseConfig(lease.lease_terms)

    let amount = 0
    let breakdown: any = {}

    if (paymentType === "move_in") {
      amount = config?.move_in_total || (lease.deposit_amount + lease.monthly_rent)
      breakdown = {
        deposit: config?.deposit_required ? lease.deposit_amount : null,
        base_rent: lease.monthly_rent,
        extras: config?.extras || [],
        total: amount,
      }
    } else if (paymentType === "monthly_rent") {
      amount = config?.monthly_total || lease.monthly_rent
      breakdown = {
        base_rent: lease.monthly_rent,
        extras: config?.extras || [],
        total: amount,
      }
    } else if (paymentType === "admin_fee") {
      amount = ADMIN_FEE
      breakdown = { admin_fee: ADMIN_FEE, total: ADMIN_FEE }
    } else if (paymentType === "cancel_penalty") {
      amount = CANCEL_PENALTY
      breakdown = { penalty: CANCEL_PENALTY, total: CANCEL_PENALTY }
    }

    return NextResponse.json({
      lease_id: leaseId,
      payment_type: paymentType,
      amount,
      breakdown,
      ozow_enabled: OZOW_ENABLED,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
