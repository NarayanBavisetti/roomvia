'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  X, 
  Minus, 
  Maximize2, 
  Send, 
  Loader2, 
  MessageCircle,
  Minimize2 
} from 'lucide-react'
import { useChat } from '@/contexts/chat-context'
import { useAuth } from '@/contexts/auth-context'
import '@/lib/chat'
import type { ChatWindow } from '@/contexts/chat-context'

interface ChatWindowProps {
  chat: ChatWindow
}

export default function ChatWindowComponent({ chat }: ChatWindowProps) {
  const { user } = useAuth()
  const { closeChat, minimizeChat, expandChat, sendMessage, markAsRead, isLoadingMessages } = useChat()
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!chat.isMinimized && chat.unreadCount > 0) {
      markAsRead(chat.id)
    }
  }, [chat.isMinimized, chat.unreadCount, chat.id, markAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const message = newMessage.trim()
    if (!message || isSending) return

    setIsSending(true)
    setNewMessage('')
    
    try {
      await sendMessage(chat.id, message)
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(message) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  const getUserInitials = (email: string | null) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Expanded (full screen) view
  if (chat.isExpanded) {
    return (
      <Dialog open={true} onOpenChange={() => expandChat(chat.id)}>
        <DialogContent className="sm:max-w-4xl h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-500 text-white text-sm font-medium">
                    {getUserInitials(chat.otherUserEmail)}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-lg font-semibold">
                  {chat.displayName}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => expandChat(chat.id)}
                  className="h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => closeChat(chat.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages[chat.id] ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
                </div>
              ) : chat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">Start your conversation with {chat.displayName}</p>
                </div>
              ) : (
                <>
                  {chat.messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user?.id
                    const showAvatar = index === 0 || chat.messages[index - 1].sender_id !== message.sender_id
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                          showAvatar ? 'mt-4' : 'mt-1'
                        }`}
                      >
                        <div className={`flex items-end max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {showAvatar && !isOwnMessage && (
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="bg-gray-400 text-white text-xs">
                                {getUserInitials(message.sender_email)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-purple-500 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          } ${!showAvatar ? (isOwnMessage ? 'mr-8' : 'ml-8') : ''}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message_text}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${chat.displayName}...`}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-purple-500 hover:bg-purple-800"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Minimized view (just header bar)
  if (chat.isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-72 bg-white border border-gray-200 rounded-t-lg shadow-lg z-40">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-purple-500 text-white rounded-t-lg cursor-pointer hover:bg-purple-800 transition-colors"
          onClick={() => minimizeChat(chat.id)}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-white text-purple-500 text-xs font-medium">
                {getUserInitials(chat.otherUserEmail)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate max-w-[150px]">
              {chat.displayName}
            </span>
            {chat.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              closeChat(chat.id)
            }}
            className="h-6 w-6 text-white hover:bg-purple-500"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  // Normal popup view
  return (
    <div className="fixed bottom-0 right-4 w-80 h-96 bg-white border border-gray-200 rounded-t-lg shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-500 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-white text-purple-500 text-xs font-medium">
              {getUserInitials(chat.otherUserEmail)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate max-w-[150px]">
            {chat.displayName}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => expandChat(chat.id)}
            className="h-6 w-6 text-white hover:bg-purple-800"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => minimizeChat(chat.id)}
            className="h-6 w-6 text-white hover:bg-purple-800"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => closeChat(chat.id)}
            className="h-6 w-6 text-white hover:bg-purple-800"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoadingMessages[chat.id] ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">Start your conversation</p>
          </div>
        ) : (
          <>
            {chat.messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-xs ${
                    isOwnMessage
                      ? 'bg-purple-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">
                      {message.message_text}
                    </p>
                    <p className={`text-[10px] mt-1 opacity-70`}>
                      {formatMessageDate(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 text-sm h-8"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="bg-purple-500 hover:bg-purple-800 h-8 w-8"
          >
            {isSending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}