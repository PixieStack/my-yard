import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const township = searchParams.get("township") || ""
    const city = searchParams.get("city") || ""
    const province = searchParams.get("province") || ""

    if (!township && !city && !province) {
      return NextResponse.json(
        { error: "At least one search parameter (township, city, or province) is required" },
        { status: 400 }
      )
    }

    // Build query for properties with new location fields
    let query = supabase
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
        location_name,
        location_city,
        location_province,
        status,
        created_at
      `
      )
      .eq("status", "available")
      .eq("is_active", true)

    // Apply filters based on new location fields
    if (township) {
      query = query.ilike("location_name", `%${township}%`)
    }
    if (city) {
      query = query.ilike("location_city", `%${city}%`)
    }
    if (province) {
      query = query.eq("location_province", province)
    }

    const { data: properties, error: propError } = await query.order("created_at", { ascending: false })

    if (propError) {
      console.error("Properties query error:", propError.message)
      
      // Fallback: Try querying with old township_id if new columns don't exist
      const { data: townships, error: townshipError } = await supabase
        .from("townships")
        .select("id, name, city, province, type")
        .ilike("name", `%${township}%`)
        .eq("is_active", true)

      if (townshipError || !townships?.length) {
        return NextResponse.json({ 
          properties: [], 
          total: 0, 
          search: { township, city, province },
          note: "No matching locations found"
        })
      }

      const townshipIds = townships.map((t) => t.id)

      const { data: legacyProperties, error: legacyError } = await supabase
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
          status,
          created_at,
          township:townships(id, name, city, province, type)
        `
        )
        .in("township_id", townshipIds)
        .eq("status", "available")
        .order("created_at", { ascending: false })

      if (legacyError) {
        return NextResponse.json({ 
          properties: [], 
          total: 0, 
          search: { township, city, province },
          note: "Database schema may need migration"
        })
      }

      return NextResponse.json({
        properties: legacyProperties || [],
        total: (legacyProperties || []).length,
        search: { township, city, province },
        matched_townships: townships,
      })
    }

    return NextResponse.json(
      {
        properties: properties || [],
        total: (properties || []).length,
        search: { township, city, province },
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
