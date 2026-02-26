import { NextRequest, NextResponse } from "next/server"
import { SOUTH_AFRICAN_TOWNSHIPS, searchTownships } from "@/lib/data/townships"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const province = searchParams.get("province") || ""
    const limit = parseInt(searchParams.get("limit") || "50")

    // Use static data from townships.ts (873 locations)
    let townships = search ? searchTownships(search) : [...SOUTH_AFRICAN_TOWNSHIPS]

    // Apply province filter
    if (province) {
      townships = townships.filter(
        (t) => t.province.toLowerCase() === province.toLowerCase()
      )
    }

    // Sort by province, city, then name
    const sorted = townships.sort((a, b) =>
      a.province !== b.province
        ? a.province.localeCompare(b.province)
        : a.city !== b.city
          ? a.city.localeCompare(b.city)
          : a.name.localeCompare(b.name)
    )

    // Apply limit
    const limited = sorted.slice(0, limit)

    return NextResponse.json(
      { townships: limited, total: sorted.length },
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
