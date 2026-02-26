"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Search, Send } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  subject: string
  message: string
  message_type: "general" | "viewing" | "payment" | "maintenance" | "lease"
  is_read: boolean
  created_at: string
  sender_id: string
  recipient_id: string
  property_id: string | null
  sender: {
    first_name: string
    last_name: string
    role: string
  }
  property?: {
    title: string
    address: string
  }
}

interface Conversation {
  id: string
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  property: {
    id: string
    title: string
  }
  last_message: {
    content: string
    sent_at: string
    sender_type: string
  }
  unread_count: number
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (profile?.id) {
      fetchConversations()

      // Real-time subscription for new messages
      const channel = supabase
        .channel("landlord-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${profile.id}`,
          },
          () => {
            fetchConversations()
            if (selectedConversation) {
              fetchMessages(selectedConversation)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [profile?.id])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      // First, get all messages where landlord is sender or recipient
      const { data: allMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, property_id, created_at, message, subject")
        .or(`sender_id.eq.${profile?.id},recipient_id.eq.${profile?.id}`)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return
      }

      if (!allMessages || allMessages.length === 0) {
        setConversations([])
        return
      }

      // Get unique tenant IDs and property IDs from messages
      const tenantIds = new Set<string>()
      const propertyIds = new Set<string>()

      allMessages.forEach((message) => {
        if (message.sender_id === profile?.id) {
          tenantIds.add(message.recipient_id)
        } else {
          tenantIds.add(message.sender_id)
        }
        if (message.property_id) {
          propertyIds.add(message.property_id)
        }
      })

      // Fetch tenant profiles
      const { data: tenantProfiles, error: tenantsError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", Array.from(tenantIds))

      if (tenantsError) {
        console.error("Error fetching tenant profiles:", tenantsError)
      }

      // Fetch properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", Array.from(propertyIds))

      if (propertiesError) {
        console.error("Error fetching properties:", propertiesError)
      }

      // Create lookup maps
      const tenantsMap = new Map(tenantProfiles?.map((t) => [t.id, t]) || [])
      const propertiesMap = new Map(properties?.map((p) => [p.id, p]) || [])

      // Group messages by tenant-property combination
      const conversationMap = new Map<string, any>()

      allMessages.forEach((message) => {
        const tenantId = message.sender_id === profile?.id ? message.recipient_id : message.sender_id
        const propertyId = message.property_id || "no-property"
        const conversationKey = `${tenantId}___${propertyId}`

        if (!conversationMap.has(conversationKey)) {
          const tenant = tenantsMap.get(tenantId)
          const property = propertiesMap.get(message.property_id || "")

          conversationMap.set(conversationKey, {
            id: conversationKey,
            tenant: tenant || {
              id: tenantId,
              first_name: "Unknown",
              last_name: "Tenant",
              email: "No email",
            },
            property: property || {
              id: message.property_id || "unknown",
              title: message.property_id ? "Unknown Property" : "General Messages",
            },
            last_message: {
              content: message.message,
              sent_at: message.created_at,
              sender_type: message.sender_id === profile?.id ? "landlord" : "tenant",
            },
            unread_count: 0,
          })
        } else {
          // Update with latest message if this one is newer
          const existing = conversationMap.get(conversationKey)
          if (new Date(message.created_at) > new Date(existing.last_message.sent_at)) {
            existing.last_message = {
              content: message.message,
              sent_at: message.created_at,
              sender_type: message.sender_id === profile?.id ? "landlord" : "tenant",
            }
          }
        }
      })

      const conversationsData = Array.from(conversationMap.values())
      setConversations(conversationsData)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const [tenantId, propertyId] = conversationId.split("___")

      // Find the conversation to get tenant and property info
      const conversation = conversations.find((c) => c.id === conversationId)
      if (!conversation) return

      console.log(`Fetching messages between landlord ${profile?.id} and tenant ${tenantId}`)

      let messagesQuery = supabase
        .from("messages")
        .select("id, subject, message, message_type, is_read, created_at, sender_id, recipient_id, property_id")
        .or(
          `and(sender_id.eq.${profile?.id},recipient_id.eq.${tenantId}),and(sender_id.eq.${tenantId},recipient_id.eq.${profile?.id})`,
        )
        .order("created_at", { ascending: true })

      // Only filter by property if it's not a general conversation
      if (propertyId !== "no-property" && propertyId !== "unknown") {
        messagesQuery = messagesQuery.eq("property_id", propertyId)
      }

      const { data: messagesData, error: messagesError } = await messagesQuery

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return
      }

      console.log(`Found ${messagesData?.length || 0} messages`)

      // Get unique sender IDs to fetch sender profiles
      const senderIds = [...new Set(messagesData?.map((m) => m.sender_id) || [])]

      const { data: senderProfiles, error: sendersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", senderIds)

      if (sendersError) {
        console.error("Error fetching sender profiles:", sendersError)
      }

      // Get property info if available
      let propertyData = null
      if (propertyId !== "no-property" && propertyId !== "unknown") {
        const { data, error: propertyError } = await supabase
          .from("properties")
          .select("id, title, address")
          .eq("id", propertyId)

        if (propertyError) {
          console.error("Error fetching property:", propertyError)
        } else if (data && data.length > 0) {
          propertyData = data[0]
        }
      }

      // Create lookup map for senders
      const sendersMap = new Map(senderProfiles?.map((s) => [s.id, s]) || [])

      // Transform messages with sender info
      const transformedMessages =
        messagesData?.map((message) => ({
          ...message,
          sender: sendersMap.get(message.sender_id) || {
            first_name: "Unknown",
            last_name: "User",
            role: "unknown",
          },
          property: propertyData || { title: conversation.property.title, address: "" },
        })) || []

      setMessages(transformedMessages)

      console.log(`Fetched ${transformedMessages.length} messages for conversation ${conversationId}`)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const conversation = conversations.find((c) => c.id === selectedConversation)
      if (!conversation) return

      const propertyId = conversation.property.id === "unknown" ? null : conversation.property.id

      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert({
          sender_id: profile?.id,
          recipient_id: conversation.tenant.id,
          property_id: propertyId,
          subject: "Message from Landlord",
          message: newMessage,
          message_type: "general",
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error sending message:", error)
        throw error
      }

      console.log("Message sent successfully:", insertedMessage)

      const newMsg: Message = {
        id: insertedMessage.id,
        subject: insertedMessage.subject,
        message: insertedMessage.message,
        message_type: insertedMessage.message_type,
        is_read: insertedMessage.is_read,
        created_at: insertedMessage.created_at,
        sender_id: insertedMessage.sender_id,
        recipient_id: insertedMessage.recipient_id,
        property_id: insertedMessage.property_id,
        sender: {
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          role: "landlord",
        },
        property: {
          title: conversation.property.title,
          address: "",
        },
      }

      setMessages((prev) => [...prev, newMsg])
      setNewMessage("")

      fetchConversations()

      console.log("Message sent successfully to tenant:", conversation.tenant.first_name)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.property.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">Communicate with your tenants</p>
        </div>
        <Badge variant="outline">{conversations.length} Conversations</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                      selectedConversation === conversation.id ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {conversation.tenant.first_name[0]}
                          {conversation.tenant.last_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {conversation.tenant.first_name} {conversation.tenant.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{conversation.property.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-1">{conversation.last_message.content}</p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No conversations found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  {conversations.find((c) => c.id === selectedConversation)?.tenant.first_name}{" "}
                  {conversations.find((c) => c.id === selectedConversation)?.tenant.last_name}
                </CardTitle>
                <CardDescription>
                  {conversations.find((c) => c.id === selectedConversation)?.property.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === profile?.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === profile?.id ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {message.sender.first_name} {message.sender.last_name}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No messages found</p>
                    </div>
                  )}
                </div>
                {/* Input for new message */}
                <div className="flex items-center">
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
