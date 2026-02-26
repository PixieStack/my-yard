import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      // Table might not exist yet - return empty
      return NextResponse.json({ notifications: [], unread_count: 0 })
    }

    const unreadCount = (data || []).filter((n: any) => !n.is_read).length

    return NextResponse.json({
      notifications: data || [],
      unread_count: unreadCount,
    })
  } catch {
    return NextResponse.json({ notifications: [], unread_count: 0 })
  }
}
