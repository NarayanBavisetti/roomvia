import { supabase } from './supabase'
import type { Message, ChatListItem, ConversationMessage } from './supabase'

export const chatService = {
  // Send a message
  async sendMessage(receiverId: string, messageText: string): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: messageText,
        })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // Get conversation between current user and another user
  async getConversation(otherUserId: string, pageSize = 50, pageOffset = 0): Promise<{ data: ConversationMessage[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase.rpc('get_conversation', {
        user1_id: user.id,
        user2_id: otherUserId,
        page_size: pageSize,
        page_offset: pageOffset,
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Get chat list for current user
  async getChatList(): Promise<{ data: ChatListItem[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase.rpc('get_chat_list', {
        user_id: user.id,
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Mark messages as read
  async markMessagesRead(senderUserId: string): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabase.rpc('mark_messages_read', {
        sender_user_id: senderUserId,
        receiver_user_id: user.id,
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // Subscribe to new messages for a specific conversation
  async subscribeToConversation(otherUserId: string, callback: (message: Message) => void) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return supabase
      .channel(`messages_${user.id}_${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message
          // Only notify if message is part of this conversation
          if (
            (message.sender_id === user.id && message.receiver_id === otherUserId) ||
            (message.sender_id === otherUserId && message.receiver_id === user.id)
          ) {
            callback(message)
          }
        }
      )
      .subscribe()
  },

  // Subscribe to chat list updates
  async subscribeToChatList(callback: () => void) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return supabase
      .channel(`chat_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message
          // Only notify if user is involved in this message
          if (message.sender_id === user.id || message.receiver_id === user.id) {
            callback()
          }
        }
      )
      .subscribe()
  }
}

// Helper to get display name from user
export const getDisplayName = (email: string | null): string => {
  if (!email) return 'Unknown User'
  return email.split('@')[0]
}

// Helper to format message time
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

// Helper to truncate message preview
export const truncateMessage = (message: string, maxLength = 50): string => {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}