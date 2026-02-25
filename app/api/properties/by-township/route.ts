import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const township = searchParams.get("township") || ""

    if (!township) {
      return NextResponse.json(
        { error: "township parameter is required" },
        { status: 400 }
      )
    }

    // Find matching townships first
    const { data: townships, error: townshipError } = await supabase
      .from("townships")
      .select("id, name, city, province, type")
      .ilike("name", `%${township}%`)
      .eq("is_active", true)

    if (townshipError) {
      return NextResponse.json({ error: townshipError.message }, { status: 500 })
    }

    const townshipIds = (townships || []).map((t) => t.id)

    if (townshipIds.length === 0) {
      return NextResponse.json({ properties: [], total: 0, township })
    }

    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select(
        `
        id,
        title,
        description,
        property_type,
        rent_amount,
        deposit_amount,
        bedrooms,
        bathrooms,
        address,
        is_furnished,
        pets_allowed,
        status,
        created_at,
        township:townships(id, name, city, province, type)
      `
      )
      .in("township_id", townshipIds)
      .eq("status", "available")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        properties: properties || [],
        total: (properties || []).length,
        township,
        matched_townships: townships,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
