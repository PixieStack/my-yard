import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      )
    }

    // Get messages for the conversation
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!sender_id(id, first_name, last_name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error("Messages API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { conversationId, senderId, content } = body

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: "Conversation ID, sender ID, and content required" },
        { status: 400 }
      )
    }

    // Create new message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select(`
        *,
        sender:profiles!sender_id(id, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { messageIds, isRead } = body

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: "Message IDs array required" },
        { status: 400 }
      )
    }

    // Mark messages as read
    const { error } = await supabase
      .from("messages")
      .update({ is_read: isRead ?? true })
      .in("id", messageIds)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update messages error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
