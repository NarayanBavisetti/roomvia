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

  // Generate unique chat ID from two user IDs
  const generateChatId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_')
  }

  // Load chat list
  const refreshChatList = useCallback(async () => {
    if (!user) return
    
    setIsLoadingChatList(true)
    const { data, error } = await chatService.getChatList()
    
    if (error) {
      console.error('Error loading chat list:', error)
    } else {
      setChatList(data || [])
    }
    setIsLoadingChatList(false)
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
    const chatId = generateChatId(user?.id || '', otherUserId)
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
    
    // Load messages
    await loadMessages(chatId, otherUserId)
    
    // Mark as read
    await chatService.markMessagesRead(otherUserId)
    
    // Close sidebar if on mobile
    setIsSidebarOpen(false)
  }, [user, chatWindows, loadMessages])

  // Close chat window
  const closeChat = (chatId: string) => {
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
    } else {
      // Optimistically add message to UI
      const newMessage: ConversationMessage = {
        id: Date.now().toString(), // Temporary ID
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
            ? { ...c, messages: [...c.messages, newMessage] }
            : c
        )
      )

      // Refresh chat list to update latest message
      refreshChatList()
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

  // Load chat list on mount
  useEffect(() => {
    if (user) {
      refreshChatList()
    }
  }, [user, refreshChatList])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return

    // Subscribe to chat list updates
    let chatListSubscription: { unsubscribe: () => void } | null = null
    
    chatService.subscribeToChatList(() => {
      refreshChatList()
    }).then((subscription) => {
      chatListSubscription = subscription
    })

    return () => {
      if (chatListSubscription) {
        chatListSubscription.unsubscribe()
      }
    }
  }, [user, refreshChatList])

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