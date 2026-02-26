import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const province = searchParams.get("province") || ""
    const city = searchParams.get("city") || ""
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = supabase.from("townships").select("*")

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,province.ilike.%${search}%`)
    }

    // Apply province filter
    if (province) {
      query = query.eq("province", province)
    }

    // Apply city filter
    if (city) {
      query = query.eq("city", city)
    }

    // Order and limit
    query = query.order("province").order("city").order("name").limit(limit)

    const { data: townships, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(
      { townships: townships || [], total: townships?.length || 0 },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    )
  } catch (error: any) {
    console.error("Townships API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
