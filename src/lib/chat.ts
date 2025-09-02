import { supabase } from './supabase'
import type { Message, ChatListItem, ConversationMessage } from './supabase'

export const chatService = {
  // Send a message
  async sendMessage(receiverId: string, messageText: string, listingId?: string, flatmateId?: string): Promise<{ error: Error | null, chatId?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: new Error('User not authenticated') }
      }
      
      console.log('Current authenticated user for sendMessage:', { 
        id: user.id, 
        email: user.email,
        aud: user.aud,
        role: user.role 
      })

      // First, find existing chat between the users (try both directions)
      // Use .maybeSingle() instead of .single() to handle 0 rows gracefully
      let { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', receiverId)
        .maybeSingle()

      // If not found, try the reverse direction
      if (!existingChat && !chatError) {
        const result = await supabase
          .from('chats')
          .select('id')
          .eq('user1_id', receiverId)
          .eq('user2_id', user.id)
          .maybeSingle()
        
        existingChat = result.data
        chatError = result.error
      }

      let chatId: string

      if (!existingChat && !chatError) {
        // No existing chat found, create one
        const insertData: {
          user1_id: string
          user2_id: string
          last_message: string
          last_message_at: string
          listing_id?: string
          flatmate_id?: string
        } = {
          user1_id: user.id,
          user2_id: receiverId,
          last_message: messageText,
          last_message_at: new Date().toISOString()
        }

        // Add listing or flatmate context (one is required by constraint)
        if (listingId) {
          insertData.listing_id = listingId
        } else if (flatmateId) {
          insertData.flatmate_id = flatmateId
        } else {
          // This should not happen for new chats - every new chat must have context
          // But for old schema or chat list reopening, we'll allow it
          console.log('No context provided - assuming old schema or existing chat')
        }

        console.log('Attempting to create chat:', insertData)
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert(insertData)
          .select('id')
          .single()

        console.log('Chat creation result:', { error: createError, data: newChat })
        if (createError) {
          return { error: createError }
        }
        chatId = newChat.id
      } else if (chatError) {
        return { error: chatError }
      } else if (existingChat) {
        chatId = existingChat.id
        // Update last message info
        await supabase
          .from('chats')
          .update({
            last_message: messageText,
            last_message_at: new Date().toISOString()
          })
          .eq('id', chatId)
      } else {
        return { error: new Error('Failed to find or create chat') }
      }

      // Try both message formats to determine which schema is active
      
      // First try the new schema (with chat_id and content)
      const newSchemaMessage = {
        chat_id: chatId,
        sender_id: user.id,
        content: messageText,
      }
      
      console.log('Attempting new schema message insert:', newSchemaMessage)
      const { error: newSchemaError, data: newSchemaResult } = await supabase
        .from('messages')
        .insert(newSchemaMessage)
        .select()
      
      if (!newSchemaError) {
        console.log('New schema message insert successful:', newSchemaResult)
        return { error: null, chatId }
      }
      
      console.log('New schema failed, trying old schema. Error:', newSchemaError)
      
      // If new schema failed, try old schema (with receiver_id and message_text)
      const oldSchemaMessage = {
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: messageText,
      }
      
      console.log('Attempting old schema message insert:', oldSchemaMessage)
      console.log('User ID types:', {
        sender_id_type: typeof user.id,
        receiver_id_type: typeof receiverId,
        sender_id_length: user.id.length,
        receiver_id_length: receiverId.length
      })
      
      // Test database authentication context
      console.log('Testing database auth context...')
      const { data: authTest, error: authTestError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      console.log('Profile lookup result (tests auth context):', { data: authTest, error: authTestError })
      
      const { error: oldSchemaError, data: oldSchemaResult } = await supabase
        .from('messages')
        .insert(oldSchemaMessage)
        .select()
      
      if (!oldSchemaError) {
        console.log('Old schema message insert successful:', oldSchemaResult)
        return { error: null, chatId: 'direct' }
      }
      
      console.log('Both schemas failed. New schema error:', newSchemaError, 'Old schema error:', oldSchemaError)
      
      // Both failed, return the more recent error
      return { error: oldSchemaError || newSchemaError, chatId }
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

      // First try the old schema (direct messages)
      console.log('Trying old schema for conversation')
      const { data: oldSchemaMessages, error: oldSchemaError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message_text,
          created_at,
          is_read
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .range(pageOffset, pageOffset + pageSize - 1)
      
      if (!oldSchemaError && oldSchemaMessages) {
        console.log('Old schema conversation successful:', oldSchemaMessages.length, 'messages')
        const transformedMessages: ConversationMessage[] = oldSchemaMessages.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          message_text: msg.message_text,
          created_at: msg.created_at,
          is_read: msg.is_read,
          sender_email: msg.sender_id === user.id ? (user.email || null) : null
        }))
        return { data: transformedMessages, error: null }
      }

      console.log('Old schema failed, trying new schema. Error:', oldSchemaError)

      // If old schema failed, try new schema with chats table
      // Get the chat between these users (try both directions)
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', otherUserId)
        .maybeSingle()

      // If not found, try the reverse direction
      if (!chat && !chatError) {
        const result = await supabase
          .from('chats')
          .select('id')
          .eq('user1_id', otherUserId)
          .eq('user2_id', user.id)
          .maybeSingle()
        
        chat = result.data
        chatError = result.error
      }

      if (chatError) {
        return { data: null, error: chatError }
      }

      if (!chat) {
        // No chat found, return empty array
        return { data: [], error: null }
      }

      // Get messages from this chat
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          is_read
        `)
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .range(pageOffset, pageOffset + pageSize - 1)

      if (messagesError) {
        return { data: null, error: messagesError }
      }

      // Transform to match expected format
      const transformedMessages: ConversationMessage[] = (messages || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.sender_id === user.id ? otherUserId : user.id,
        message_text: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender_email: msg.sender_id === user.id ? (user.email || null) : null
      }))

      return { data: transformedMessages, error: null }
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

      // Get all chats for this user (simplified approach)
      const { data: chatsAsUser1, error: error1 } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at
        `)
        .eq('user1_id', user.id)
        .order('last_message_at', { ascending: false })

      const { data: chatsAsUser2, error: error2 } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at
        `)
        .eq('user2_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error1 || error2) {
        console.error('Chat list error:', error1 || error2)
        return { data: null, error: error1 || error2 }
      }

      const chatList: ChatListItem[] = []

      // Process chats where current user is user1
      for (const chat of chatsAsUser1 || []) {
        const otherUserId = chat.user2_id
        
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', otherUserId)
          .maybeSingle()

        // Count unread messages from the other user
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false)

        chatList.push({
          other_user_id: otherUserId,
          other_user_email: profile?.email || null,
          latest_message: chat.last_message,
          latest_message_time: chat.last_message_at,
          unread_count: unreadCount || 0,
          is_sender: false
        })
      }

      // Process chats where current user is user2
      for (const chat of chatsAsUser2 || []) {
        const otherUserId = chat.user1_id
        
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', otherUserId)
          .maybeSingle()

        // Count unread messages from the other user
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false)

        chatList.push({
          other_user_id: otherUserId,
          other_user_email: profile?.email || null,
          latest_message: chat.last_message,
          latest_message_time: chat.last_message_at,
          unread_count: unreadCount || 0,
          is_sender: false
        })
      }

      // Sort by last message time
      chatList.sort((a, b) => 
        new Date(b.latest_message_time || 0).getTime() - new Date(a.latest_message_time || 0).getTime()
      )

      return { data: chatList, error: null }
    } catch (error) {
      console.error('getChatList error:', error)
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

      // Find the chat between these users (try both directions)
      let { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', senderUserId)
        .maybeSingle()

      // If not found, try the reverse direction
      if (!chat && !chatError) {
        const result = await supabase
          .from('chats')
          .select('id')
          .eq('user1_id', senderUserId)
          .eq('user2_id', user.id)
          .maybeSingle()
        
        chat = result.data
        chatError = result.error
      }

      if (chatError) {
        return { error: chatError }
      }

      if (!chat) {
        return { error: new Error('Chat not found') }
      }

      // Mark messages as read where sender is the other user
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chat.id)
        .eq('sender_id', senderUserId)
        .eq('is_read', false)

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
        async (payload) => {
          const message = payload.new as { id: string; sender_id: string; chat_id: string; content: string; created_at: string; is_read: boolean }
          // Get the chat details to check if user is involved
          const { data: chat } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', message.chat_id)
            .single()
          
          if (chat && 
              ((chat.user1_id === user.id && chat.user2_id === otherUserId) ||
               (chat.user1_id === otherUserId && chat.user2_id === user.id))) {
            // Transform message to match expected interface
            const transformedMessage: Message = {
              id: message.id,
              sender_id: message.sender_id,
              receiver_id: chat.user1_id === message.sender_id ? chat.user2_id : chat.user1_id,
              message_text: message.content,
              created_at: message.created_at,
              updated_at: message.created_at,
              is_read: message.is_read
            }
            callback(transformedMessage)
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
        async (payload) => {
          const message = payload.new as { id: string; sender_id: string; chat_id: string; content: string; created_at: string; is_read: boolean }
          // Get the chat details to check if user is involved
          const { data: chat } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', message.chat_id)
            .single()
          
          if (chat && (chat.user1_id === user.id || chat.user2_id === user.id)) {
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