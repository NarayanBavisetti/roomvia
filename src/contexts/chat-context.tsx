'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { chatService, getDisplayName } from '@/lib/chat'
import { useAuth } from './auth-context'
import type { ChatListItem, ConversationMessage } from '@/lib/supabase'
import { showToast } from '@/lib/toast'

export interface ChatWindow {
  id: string
  otherUserId: string
  otherUserEmail: string
  displayName: string
  isMinimized: boolean
  isExpanded: boolean
  messages: ConversationMessage[]
  unreadCount: number
  listingId?: string
  flatmateId?: string
}

interface ChatContextType {
  // Chat sidebar
  isSidebarOpen: boolean
  toggleSidebar: () => void
  chatList: ChatListItem[]
  refreshChatList: () => void
  
  // Chat windows
  chatWindows: ChatWindow[]
  openChat: (otherUserId: string, otherUserEmail: string, listingId?: string, flatmateId?: string) => void
  closeChat: (chatId: string) => void
  minimizeChat: (chatId: string) => void
  expandChat: (chatId: string) => void
  
  // Messaging
  sendMessage: (chatId: string, message: string) => Promise<void>
  markAsRead: (chatId: string) => void
  
  // Loading states
  isLoadingChatList: boolean
  isLoadingMessages: { [chatId: string]: boolean }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatList, setChatList] = useState<ChatListItem[]>([])
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([])
  const [isLoadingChatList, setIsLoadingChatList] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState<{ [chatId: string]: boolean }>({})
  const [chatSubscriptions, setChatSubscriptions] = useState<{ [chatId: string]: { unsubscribe: () => void } }>({})

  // Generate unique chat ID from two user IDs
  const generateChatId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_')
  }

  // Load chat list - simplified without debouncing dependencies
  const refreshChatList = useCallback(async () => {
    if (!user) return
    
    setIsLoadingChatList(true)
    try {
      const { data, error } = await chatService.getChatList()
      
      if (error) {
        console.error('Error loading chat list:', error)
      } else {
        setChatList(data || [])
      }
    } finally {
      setIsLoadingChatList(false)
    }
  }, [user])

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId: string, otherUserId: string) => {
    setIsLoadingMessages(prev => ({ ...prev, [chatId]: true }))
    
    const { data, error } = await chatService.getConversation(otherUserId)
    
    if (error) {
      console.error('Error loading messages:', error)
    } else {
      setChatWindows(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { 
                ...chat, 
                messages: (data || []).slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              }
            : chat
        )
      )
    }
    
    setIsLoadingMessages(prev => ({ ...prev, [chatId]: false }))
  }, [])

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
    if (!isSidebarOpen) {
      refreshChatList()
    }
  }

  // Open chat window
  const openChat = useCallback(async (otherUserId: string, otherUserEmail: string, listingId?: string, flatmateId?: string) => {
    if (!user) return
    if (otherUserId === user.id) {
      showToast('You cannot chat with yourself.')
      return
    }
    
    const displayName = getDisplayName(otherUserEmail)
    
    // Check if chat window already exists for this other user
    const existingChatWindow = chatWindows.find(chat => chat.otherUserId === otherUserId)
    if (existingChatWindow) {
      // Unminimize if minimized
      if (existingChatWindow.isMinimized) {
        setChatWindows(prev =>
          prev.map(chat =>
            chat.otherUserId === otherUserId
              ? { ...chat, isMinimized: false }
              : chat
          )
        )
      }
      return
    }

    // Create new chat window with temporary ID (will be updated when first message is sent)
    const tempChatId = generateChatId(user.id, otherUserId)
    const newChatWindow: ChatWindow = {
      id: tempChatId, // This will be updated with real database ID
      otherUserId,
      otherUserEmail,
      displayName,
      isMinimized: false,
      isExpanded: false,
      messages: [],
      unreadCount: 0,
      listingId,
      flatmateId
    }

    setChatWindows(prev => [...prev, newChatWindow])
    
    // Set up realtime subscription for this chat
    const subscription = await chatService.subscribeToConversation(otherUserId, (message) => {
      console.log('Received realtime message:', { message, otherUserId })
      setChatWindows(prev =>
        prev.map(c => {
          if (c.otherUserId === otherUserId) {
            // Check if message already exists to avoid duplicates
            const messageExists = c.messages.some(m => m.id === message.id)
            console.log('Message processing:', { messageExists, currentMessageCount: c.messages.length })
            if (!messageExists) {
              const conversationMessage = {
                id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                message_text: message.message_text,
                created_at: message.created_at,
                is_read: message.is_read,
                sender_email: message.sender_id === user.id ? (user.email || null) : otherUserEmail
              }
              
              // Remove any optimistic message with the same content
              const filteredMessages = c.messages.filter(m => 
                !m.id.startsWith('temp_') || m.message_text !== message.message_text
              )
              
              return { ...c, messages: [...filteredMessages, conversationMessage] }
            }
          }
          return c
        })
      )
    })

    if (subscription) {
      setChatSubscriptions(prev => ({ ...prev, [otherUserId]: subscription }))
    }
    
    // Load messages
    await loadMessages(tempChatId, otherUserId)
    
    // Mark as read
    await chatService.markMessagesRead(otherUserId)
    
    // Close sidebar if on mobile
    setIsSidebarOpen(false)
  }, [user, chatWindows, loadMessages])

  // Close chat window
  const closeChat = (chatId: string) => {
    // Find the chat window to get the otherUserId
    const chatWindow = chatWindows.find(chat => chat.id === chatId)
    if (chatWindow) {
      // Unsubscribe from this chat's realtime updates using otherUserId
      if (chatSubscriptions[chatWindow.otherUserId]) {
        chatSubscriptions[chatWindow.otherUserId].unsubscribe()
        setChatSubscriptions(prev => {
          const { [chatWindow.otherUserId]: _removed, ...rest } = prev
          void _removed  // Acknowledge unused variable
          return rest
        })
      }
    }
    
    setChatWindows(prev => prev.filter(chat => chat.id !== chatId))
  }

  // Minimize chat window
  const minimizeChat = (chatId: string) => {
    setChatWindows(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, isMinimized: !chat.isMinimized, isExpanded: false }
          : chat
      )
    )
  }

  // Expand chat window
  const expandChat = (chatId: string) => {
    setChatWindows(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, isExpanded: !chat.isExpanded, isMinimized: false }
          : chat
      )
    )
  }

  // Send message
  const sendMessage = async (chatId: string, message: string) => {
    const chat = chatWindows.find(c => c.id === chatId)
    if (!chat || !user) {
      console.log('Chat or user not found:', { chatId, hasChat: !!chat, hasUser: !!user })
      return
    }
    
    console.log('Sending message:', { 
      chatId, 
      otherUserId: chat.otherUserId, 
      message, 
      listingId: chat.listingId, 
      flatmateId: chat.flatmateId,
      hasContext: !!(chat.listingId || chat.flatmateId)
    })

    // Add optimistic message immediately for better UX
    const optimisticMessage = {
      id: `temp_${Date.now()}`, // Temporary ID
      sender_id: user.id,
      receiver_id: chat.otherUserId,
      message_text: message,
      created_at: new Date().toISOString(),
      is_read: false,
      sender_email: user.email || null
    }

    setChatWindows(prev =>
      prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, optimisticMessage] }
          : c
      )
    )

    const { error, chatId: realChatId } = await chatService.sendMessage(
      chat.otherUserId, 
      message, 
      chat.listingId, 
      chat.flatmateId
    )
    
    if (error) {
      // Remove optimistic message on error
      setChatWindows(prev =>
        prev.map(c =>
          c.id === chatId
            ? { ...c, messages: c.messages.filter(m => m.id !== optimisticMessage.id) }
            : c
        )
      )
      console.error('Error sending message:', error)
      throw error
    } else {
      // Update chat window with real database chat ID if it was returned
      if (realChatId && chat.id !== realChatId) {
        setChatWindows(prev =>
          prev.map(c =>
            c.id === chatId
              ? { ...c, id: realChatId }
              : c
          )
        )
      }
      
      // The real message will replace the optimistic one via realtime subscription
    }
  }

  // Mark messages as read
  const markAsRead = async (chatId: string) => {
    const chat = chatWindows.find(c => c.id === chatId)
    if (!chat) return

    await chatService.markMessagesRead(chat.otherUserId)
    
    setChatWindows(prev =>
      prev.map(c =>
        c.id === chatId
          ? { ...c, unreadCount: 0 }
          : c
      )
    )
    
    // Don't call refreshChatList here to avoid unnecessary API calls
  }

  // Load chat list on mount - only when user changes
  useEffect(() => {
    if (user) {
      refreshChatList()
    }
  }, [user, refreshChatList])

  // Clean up chat subscriptions when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all chat subscriptions when component unmounts
      Object.values(chatSubscriptions).forEach(sub => sub.unsubscribe())
    }
  }, [chatSubscriptions])

  const value: ChatContextType = {
    isSidebarOpen,
    toggleSidebar,
    chatList,
    refreshChatList,
    chatWindows,
    openChat,
    closeChat,
    minimizeChat,
    expandChat,
    sendMessage,
    markAsRead,
    isLoadingChatList,
    isLoadingMessages,
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    return {
      isSidebarOpen: false,
      toggleSidebar: () => {},
      chatList: [],
      refreshChatList: () => {},
      chatWindows: [],
      openChat: async () => {},
      closeChat: () => {},
      minimizeChat: () => {},
      expandChat: () => {},
      sendMessage: async () => {},
      markAsRead: () => {},
      isLoadingChatList: false,
      isLoadingMessages: {},
    }
  }
  return context
}