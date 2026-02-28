'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, AlertCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  lease_id: string;
  tenant_id: string;
  landlord_id: string;
  tenant_profile?: {
    first_name: string;
    last_name: string;
  };
  landlord_profile?: {
    first_name: string;
    last_name: string;
  };
  property?: {
    title: string;
  };
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  };
}

export function LiveMessaging({ defaultConversationId }: { defaultConversationId?: string }) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations for signed leases only
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all signed leases for this user
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id, tenant_id, landlord_id')
          .eq('signed_by_tenant', true)
          .eq('signed_by_landlord', true)
          .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);

        if (leasesError) throw leasesError;

        if (!leases || leases.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get or create conversations for each lease
        const leaseIds = leases.map((l) => l.id);

        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select(
            `
            id,
            lease_id,
            tenant_id,
            landlord_id,
            created_at,
            leases (
              id,
              properties (
                title
              )
            ),
            profiles!conversations_tenant_id_fkey (
              first_name,
              last_name
            ),
            profiles!conversations_landlord_id_fkey (
              first_name,
              last_name
            )
          `
          )
          .in('lease_id', leaseIds);

        if (convError && convError.code !== 'PGRST116') {
          throw convError;
        }

        const conversationsData = (conversations || []).map((conv: any) => ({
          id: conv.id,
          lease_id: conv.lease_id,
          tenant_id: conv.tenant_id,
          landlord_id: conv.landlord_id,
          created_at: conv.created_at,
          property: conv.leases?.properties?.[0],
        }));

        setConversations(conversationsData);

        // Select first conversation or default if provided
        if (defaultConversationId) {
          const defaultConv = conversationsData.find((c) => c.id === defaultConversationId);
          if (defaultConv) setSelectedConversation(defaultConv);
        } else if (conversationsData.length > 0) {
          setSelectedConversation(conversationsData[0]);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, defaultConversationId]);

  // Fetch messages for selected conversation and subscribe to new ones
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select(
            `
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            profiles (
              first_name,
              last_name
            )
          `
          )
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        const messagesData = (data || []).map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          sender_profile: msg.profiles,
        }));

        setMessages(messagesData);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to new messages in real-time
    const subscription = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload: any) => {
          const newMsg = {
            id: payload.new.id,
            conversation_id: payload.new.conversation_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);

    try {
      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (insertError) throw insertError;

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherUserName = (conversation: Conversation) => {
    if (user?.id === conversation.tenant_id) {
      return conversation.landlord_profile
        ? `${conversation.landlord_profile.first_name} ${conversation.landlord_profile.last_name}`
        : 'Landlord';
    } else {
      return conversation.tenant_profile
        ? `${conversation.tenant_profile.first_name} ${conversation.tenant_profile.last_name}`
        : 'Tenant';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Sign in to message</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">No active conversations</p>
          <p className="text-gray-600">You can message landlords/tenants after both have signed a lease.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-bold text-gray-900">Conversations</h3>
        </div>
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-orange-50 transition-colors ${
              selectedConversation?.id === conversation.id ? 'bg-orange-100' : ''
            }`}
          >
            <p className="font-semibold text-sm text-gray-900">
              {getOtherUserName(conversation)}
            </p>
            <p className="text-xs text-gray-500 truncate">{conversation.property?.title}</p>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 shadow-sm">
            <h2 className="font-bold">{getOtherUserName(selectedConversation)}</h2>
            <p className="text-xs text-orange-100">{selectedConversation.property?.title}</p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_id === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_id !== user.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender_profile?.first_name?.[0]}
                          {message.sender_profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-orange-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user.id ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  );
}
