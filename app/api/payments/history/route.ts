import { NextRequest, NextResponse } from "next/server"
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
    const totalPaid = payments.filter(p => p.status === "complete").reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount || 0), 0)

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
