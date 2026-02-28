"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Search, Building, ArrowLeft, X, Check, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { getTenantMessageableContacts } from "@/lib/messaging-unlock"

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
  sender?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
}

interface Conversation {
  id: string
  landlord: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export default function TenantMessagesPage() {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [willTakeWithoutViewing, setWillTakeWithoutViewing] = useState<string>("")
  const [customReason, setCustomReason] = useState("")
  const [messageableContacts, setMessageableContacts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (profile?.id) {
      fetchConversations()
      fetchMessageableContacts()

      // Real-time subscription for new messages
      const channel = supabase
        .channel("tenant-messages")
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
            fetchMessageableContacts()
            if (selectedConversation) {
              fetchMessages(selectedConversation.id)
            }
          }
        )
        .subscribe()

      // Also listen for lease changes to unlock messaging
      const leaseChannel = supabase
        .channel("tenant-leases")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "leases",
            filter: `tenant_id=eq.${profile.id}`,
          },
          () => {
            fetchMessageableContacts()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(leaseChannel)
      }
    }
  }, [profile?.id])

  const fetchMessageableContacts = async () => {
    if (!profile?.id) return
    try {
      const contacts = await getTenantMessageableContacts(profile.id)
      setMessageableContacts(new Set(contacts))
    } catch (error) {
      console.error("Error fetching messageable contacts:", error)
    }
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      console.log("Fetching conversations for tenant:", profile?.id)

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${profile?.id},sender_id.eq.${profile?.id}`)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return
      }

      if (!messagesData || messagesData.length === 0) {
        setConversations([])
        return
      }

      const landlordIds = [
        ...new Set(messagesData.map((m) => (m.sender_id === profile?.id ? m.recipient_id : m.sender_id))),
      ]
      const propertyIds = [...new Set(messagesData.map((m) => m.property_id).filter(Boolean))]

      const { data: landlordsData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", landlordIds)

      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id, title, address")
        .in("id", propertyIds)

      const landlordsMap = new Map(landlordsData?.map((l) => [l.id, l]) || [])
      const propertiesMap = new Map(propertiesData?.map((p) => [p.id, p]) || [])

      const conversationMap = new Map<string, Message[]>()

      messagesData.forEach((message) => {
        const landlordId = message.sender_id === profile?.id ? message.recipient_id : message.sender_id
        const conversationKey = `${landlordId}___${message.property_id || "general"}`

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, [])
        }
        conversationMap.get(conversationKey)!.push(message)
      })

      const conversationsList: Conversation[] = []

      conversationMap.forEach((messages, conversationKey) => {
        const [landlordId, propertyId] = conversationKey.split("___")
        const landlord = landlordsMap.get(landlordId)
        const property = propertyId !== "general" ? propertiesMap.get(propertyId) : undefined

        if (landlord) {
          const sortedMessages = messages.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )

          const unreadCount = messages.filter((m) => m.recipient_id === profile?.id && !m.is_read).length

          conversationsList.push({
            id: conversationKey,
            landlord,
            property,
            lastMessage: sortedMessages[sortedMessages.length - 1],
            unreadCount,
            messages: sortedMessages,
          })
        }
      })

      conversationsList.sort(
        (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
      )

      console.log("Found conversations:", conversationsList.length)
      setConversations(conversationsList)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      const conversation = conversations.find((c) => c.id === conversationId)
      if (!conversation) return

      setMessages(conversation.messages)

      const unreadMessageIds = conversation.messages
        .filter((m) => m.recipient_id === profile?.id && !m.is_read)
        .map((m) => m.id)

      if (unreadMessageIds.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unreadMessageIds)

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  unreadCount: 0,
                  messages: conv.messages.map((m) => (m.recipient_id === profile?.id ? { ...m, is_read: true } : m)),
                }
              : conv,
          ),
        )
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return

    setSendingReply(true)
    try {
      const [landlordId, propertyId] = selectedConversation.id.split("___")

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: profile?.id,
          recipient_id: landlordId,
          subject: `Re: ${selectedConversation.lastMessage.subject}`,
          message: replyText,
          message_type: selectedConversation.lastMessage.message_type,
          property_id: propertyId !== "general" ? propertyId : null,
        })
        .select()

      if (error) throw error

      console.log("Reply sent successfully:", data)
      setReplyText("")

      await fetchConversations()
      if (selectedConversation) {
        await fetchMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error("Error sending reply:", error)
      alert("Failed to send reply. Please try again.")
    } finally {
      setSendingReply(false)
    }
  }

  const acceptViewingRequest = async () => {
    if (!selectedConversation || !profile?.id) return

    try {
      const [landlordId, propertyId] = selectedConversation.id.split("___")

      if (propertyId !== "general") {
        await supabase
          .from("viewing_requests")
          .update({
            status: "confirmed",
            tenant_message: "I accept the viewing request. Please confirm the time and date.",
          })
          .eq("property_id", propertyId)
          .eq("tenant_id", profile.id)

        await supabase
          .from("applications")
          .update({ status: "viewing_scheduled" })
          .eq("property_id", propertyId)
          .eq("tenant_id", profile.id)
      }

      await supabase.from("messages").insert({
        sender_id: profile.id,
        recipient_id: landlordId,
        subject: `Re: ${selectedConversation.lastMessage.subject}`,
        message: "I accept the viewing request. Please confirm the time and date.",
        message_type: "viewing",
        property_id: propertyId !== "general" ? propertyId : null,
      })

      alert("Viewing request accepted!")
      await fetchConversations()
      if (selectedConversation) {
        await fetchMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error("Error accepting viewing request:", error)
      alert("Failed to accept viewing request")
    }
  }

  const handleDeclineViewing = async () => {
    if (!selectedConversation || !profile?.id) return

    try {
      const [landlordId, propertyId] = selectedConversation.id.split("___")

      if (propertyId !== "general") {
        const newStatus = willTakeWithoutViewing === "yes" ? "awaiting_landlord_decision" : "cancelled"

        await supabase
          .from("viewing_requests")
          .update({
            status: newStatus,
            willing_without_viewing: willTakeWithoutViewing === "yes",
            decline_reason:
              willTakeWithoutViewing === "no" ? (declineReason === "other" ? customReason : declineReason) : null,
            tenant_message:
              willTakeWithoutViewing === "yes"
                ? "I decline the viewing but am willing to take the apartment without viewing it."
                : `I decline the viewing request. Reason: ${declineReason === "other" ? customReason : declineReason}`,
          })
          .eq("property_id", propertyId)
          .eq("tenant_id", profile.id)

        const newAppStatus = willTakeWithoutViewing === "yes" ? "awaiting_landlord_decision" : "viewing_declined"
        await supabase
          .from("applications")
          .update({
            status: newAppStatus,
            rejection_reason:
              willTakeWithoutViewing === "no" ? (declineReason === "other" ? customReason : declineReason) : null,
          })
          .eq("property_id", propertyId)
          .eq("tenant_id", profile.id)
      }

      let messageContent = ""
      if (willTakeWithoutViewing === "yes") {
        messageContent =
          "I decline the viewing but am willing to take the apartment without viewing it. Please consider approving my application."

        await supabase.from("notifications").insert({
          user_id: landlordId,
          type: "application",
          title: "Tenant Willing to Proceed Without Viewing",
          message: `${profile.first_name} ${profile.last_name} declined the viewing but is willing to take the apartment without viewing it.`,
          action_url: `/landlord/applications`,
        }).then(({ error }) => {
          if (error) console.log("Notification insert skipped:", error.message)
        })
      } else {
        const reason = declineReason === "other" ? customReason : declineReason
        messageContent = `I decline the viewing request. Reason: ${reason}. Thank you for your time.`
      }

      await supabase.from("messages").insert({
        sender_id: profile.id,
        recipient_id: landlordId,
        subject: `Re: ${selectedConversation.lastMessage.subject}`,
        message: messageContent,
        message_type: "viewing",
        property_id: propertyId !== "general" ? propertyId : null,
      })

      setShowDeclineDialog(false)
      setDeclineReason("")
      setWillTakeWithoutViewing("")
      setCustomReason("")

      alert(
        willTakeWithoutViewing === "yes"
          ? "Viewing declined. Your willingness to take the apartment has been communicated to the landlord."
          : "Viewing declined. Your response has been sent to the landlord.",
      )

      await fetchConversations()
      if (selectedConversation) {
        await fetchMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error("Error declining viewing request:", error)
      alert("Failed to decline viewing request")
    }
  }

  const filteredConversations = conversations.filter((conversation) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${conversation.landlord.first_name} ${conversation.landlord.last_name}`.toLowerCase().includes(searchLower) ||
      conversation.property?.title.toLowerCase().includes(searchLower) ||
      conversation.lastMessage.message.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (selectedConversation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {selectedConversation.landlord.first_name} {selectedConversation.landlord.last_name}
            </h2>
            {selectedConversation.property && (
              <p className="text-gray-600 text-sm">
                {selectedConversation.property.title} - {selectedConversation.property.address}
              </p>
            )}
          </div>
        </div>

        <Card className="h-96 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="text-center py-8">Loading messages...</div>
            ) : (
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
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <div className="border-t p-4 space-y-3">
            {selectedConversation.lastMessage.message_type === "viewing" && (
              <div className="flex space-x-2 flex-wrap">
                <Button size="sm" onClick={acceptViewingRequest} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" />
                  Accept Viewing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyText("I need to reschedule this viewing. Please suggest alternative times.")}
                >
                  Request Reschedule
                </Button>
                <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline Viewing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Decline Viewing Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Are you willing to take this apartment without viewing it?
                        </Label>
                        <RadioGroup
                          value={willTakeWithoutViewing}
                          onValueChange={setWillTakeWithoutViewing}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes">Yes, I'll take it without viewing</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no">No, I'm not interested</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {willTakeWithoutViewing === "no" && (
                        <div>
                          <Label className="text-sm font-medium">Please select a reason:</Label>
                          <RadioGroup value={declineReason} onValueChange={setDeclineReason} className="mt-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="found_another_place" id="found_another" />
                              <Label htmlFor="found_another">Found another place</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="budget_constraints" id="budget" />
                              <Label htmlFor="budget">Budget constraints</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="location_not_suitable" id="location" />
                              <Label htmlFor="location">Location not suitable</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="timing_issues" id="timing" />
                              <Label htmlFor="timing">Timing doesn't work</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other">Other reason</Label>
                            </div>
                          </RadioGroup>

                          {declineReason === "other" && (
                            <Textarea
                              placeholder="Please specify your reason..."
                              value={customReason}
                              onChange={(e) => setCustomReason(e.target.value)}
                              className="mt-2"
                              rows={2}
                            />
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={handleDeclineViewing}
                          disabled={
                            !willTakeWithoutViewing ||
                            (willTakeWithoutViewing === "no" && !declineReason) ||
                            (declineReason === "other" && !customReason.trim())
                          }
                          className="flex-1"
                        >
                          Send Response
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button onClick={sendReply} disabled={!replyText.trim() || sendingReply} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">Communication with landlords and property managers</p>
        </div>
        <Badge variant="secondary">{conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)} unread</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredConversations.length > 0 ? (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const isLocked = !messageableContacts.has(conversation.landlord.id)
            return (
              <Card
                key={conversation.id}
                className={`hover:shadow-md transition-shadow ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${conversation.unreadCount > 0 ? 'border-blue-200 bg-blue-50/30' : ''}`}
                onClick={() => {
                  if (!isLocked) {
                    setSelectedConversation(conversation)
                    fetchMessages(conversation.id)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {conversation.landlord.first_name[0]}
                        {conversation.landlord.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate flex items-center gap-2">
                          {conversation.landlord.first_name} {conversation.landlord.last_name}
                          {isLocked && (
                            <Lock className="h-4 w-4 text-red-500" title="Messaging locked: approve application or sign lease to unlock" />
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="bg-blue-600">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {conversation.property && (
                        <p className="text-sm text-gray-600 truncate flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {conversation.property.title}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 truncate mt-1">{conversation.lastMessage.message}</p>
                      {isLocked && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Messaging will unlock when you have an approved application or signed lease
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search" : "You don't have any messages yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
