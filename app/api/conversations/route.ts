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

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get all conversations for the user
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        property:properties(id, title, address, city),
        landlord:profiles!landlord_id(id, first_name, last_name, avatar_url),
        tenant:profiles!tenant_id(id, first_name, last_name, avatar_url)
      `)
      .or(`landlord_id.eq.${userId},tenant_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error: any) {
    console.error("Conversations API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, landlordId, tenantId } = body

    if (!propertyId || !landlordId || !tenantId) {
      return NextResponse.json(
        { error: "Property ID, landlord ID, and tenant ID required" },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("property_id", propertyId)
      .eq("landlord_id", landlordId)
      .eq("tenant_id", tenantId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        property_id: propertyId,
        landlord_id: landlordId,
        tenant_id: tenantId,
      })
      .select(`
        *,
        property:properties(id, title, address, city),
        landlord:profiles!landlord_id(id, first_name, last_name, avatar_url),
        tenant:profiles!tenant_id(id, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error: any) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
