'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { chatService, getDisplayName } from '@/lib/chat'
import { useAuth } from './auth-context'
import type { ChatListItem, ConversationMessage } from '@/lib/supabase'

export interface ChatWindow {
  id: string
  otherUserId: string
  otherUserEmail: string
  displayName: string
  isMinimized: boolean
  isExpanded: boolean
  messages: ConversationMessage[]
  unreadCount: number
}

interface ChatContextType {
  // Chat sidebar
  isSidebarOpen: boolean
  toggleSidebar: () => void
  chatList: ChatListItem[]
  refreshChatList: () => void
  
  // Chat windows
  chatWindows: ChatWindow[]
  openChat: (otherUserId: string, otherUserEmail: string) => void
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
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null)

  // Generate unique chat ID from two user IDs
  const generateChatId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_')
  }

  // Load chat list - simplified without debouncing dependencies
  const refreshChatList = useCallback(async () => {
    if (!user || isLoadingChatList) return
    
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
  }, [user, isLoadingChatList])

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
            ? { ...chat, messages: data?.reverse() || [] }
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
  const openChat = useCallback(async (otherUserId: string, otherUserEmail: string) => {
    if (!user) return
    
    const chatId = generateChatId(user.id, otherUserId)
    const displayName = getDisplayName(otherUserEmail)
    
    // Check if chat already exists
    const existingChat = chatWindows.find(chat => chat.id === chatId)
    if (existingChat) {
      // Unminimize if minimized
      if (existingChat.isMinimized) {
        setChatWindows(prev =>
          prev.map(chat =>
            chat.id === chatId
              ? { ...chat, isMinimized: false }
              : chat
          )
        )
      }
      return
    }

    // Create new chat window
    const newChatWindow: ChatWindow = {
      id: chatId,
      otherUserId,
      otherUserEmail,
      displayName,
      isMinimized: false,
      isExpanded: false,
      messages: [],
      unreadCount: 0
    }

    setChatWindows(prev => [...prev, newChatWindow])
    
    // Set up realtime subscription for this chat
    const subscription = await chatService.subscribeToConversation(otherUserId, (message) => {
      setChatWindows(prev =>
        prev.map(c => {
          if (c.id === chatId) {
            // Check if message already exists to avoid duplicates
            const messageExists = c.messages.some(m => m.id === message.id)
            if (!messageExists) {
              const conversationMessage = {
                id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                message_text: message.message_text,
                created_at: message.created_at,
                is_read: message.is_read,
                sender_email: message.sender_id === user.id ? user.email || null : otherUserEmail
              }
              return { ...c, messages: [...c.messages, conversationMessage] }
            }
          }
          return c
        })
      )
    })

    if (subscription) {
      setChatSubscriptions(prev => ({ ...prev, [chatId]: subscription }))
    }
    
    // Load messages
    await loadMessages(chatId, otherUserId)
    
    // Mark as read
    await chatService.markMessagesRead(otherUserId)
    
    // Close sidebar if on mobile
    setIsSidebarOpen(false)
  }, [user, chatWindows, loadMessages])

  // Close chat window
  const closeChat = (chatId: string) => {
    // Unsubscribe from this chat's realtime updates
    if (chatSubscriptions[chatId]) {
      chatSubscriptions[chatId].unsubscribe()
      setChatSubscriptions(prev => {
        const { [chatId]: removed, ...rest } = prev
        return rest
      })
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
    if (!chat || !user) return

    const { error } = await chatService.sendMessage(chat.otherUserId, message)
    
    if (error) {
      console.error('Error sending message:', error)
      throw error
    } else {
      // Refresh chat list to update latest message
      refreshChatList()
      // The message will appear via realtime subscription
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
    
    refreshChatList()
  }

  // Load chat list on mount - only when user changes
  useEffect(() => {
    if (user) {
      refreshChatList()
    }
  }, [user]) // Only depend on user, not refreshChatList

  // Clean up chat subscriptions when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all chat subscriptions when component unmounts
      Object.values(chatSubscriptions).forEach(sub => sub.unsubscribe())
    }
  }, [])

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