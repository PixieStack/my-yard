import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const propertyId = searchParams.get("propertyId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/payments/history?user_id=X&role=tenant|landlord
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const role = searchParams.get("role") || "tenant"
    const leaseId = searchParams.get("lease_id")
    const type = searchParams.get("type")

    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }

    let query = supabase
      .from("payments")
      .select(`
        *,
        property:properties(id, title, address),
        user:profiles!user_id(id, first_name, last_name, email)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    if (type) {
      query = query.eq("type", type)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: payments, error } = await query

    if (error) throw error

    // Calculate totals
    const totals = {
      total: payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0,
      completed: payments?.filter(p => p.status === "completed").length || 0,
      pending: payments?.filter(p => p.status === "pending").length || 0,
      failed: payments?.filter(p => p.status === "failed").length || 0,
    }

    return NextResponse.json({ payments: payments || [], totals })
  } catch (error: any) {
    console.error("Payment history error:", error)
      .select("*")
      .order("created_at", { ascending: false })

    if (role === "tenant") {
      query = query.eq("tenant_id", userId)
    } else {
      query = query.eq("landlord_id", userId)
    }

    if (leaseId) query = query.eq("lease_id", leaseId)
    if (type) query = query.eq("payment_type", type)

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json({ payments: [], total: 0 })
    }

    const payments = data || []
    const totalPaid = payments.filter(p => p.status === "complete").reduce((s, p) => s + parseFloat(p.amount), 0)
    const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount), 0)

    return NextResponse.json({
      payments,
      total: payments.length,
      summary: {
        total_paid: totalPaid,
        total_pending: totalPending,
        count_by_status: {
          complete: payments.filter(p => p.status === "complete").length,
          pending: payments.filter(p => p.status === "pending").length,
          cancelled: payments.filter(p => p.status === "cancelled").length,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
