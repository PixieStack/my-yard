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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
