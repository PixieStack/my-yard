import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { SOUTH_AFRICAN_TOWNSHIPS, searchTownships } from "@/lib/data/townships"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Try Supabase first, fall back to static data
    try {
      const supabase = createClient()

      let query = supabase
        .from("townships")
        .select("id, name, city, province, type")
        .eq("is_active", true)
        .order("province")
        .order("city")
        .order("name")

      if (search) {
        query = query.ilike("name", `%${search}%`)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        return NextResponse.json(
          { townships: data, total: data.length },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          }
        )
      }
    } catch {
      // Fall through to static data
    }

    // Fallback to static township data
    const townships = search ? searchTownships(search) : SOUTH_AFRICAN_TOWNSHIPS
    const sorted = [...townships].sort((a, b) =>
      a.province !== b.province
        ? a.province.localeCompare(b.province)
        : a.city !== b.city
          ? a.city.localeCompare(b.city)
          : a.name.localeCompare(b.name)
    )

    return NextResponse.json(
      { townships: sorted, total: sorted.length, source: "static" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
