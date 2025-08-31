'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { X, Loader2, MessageCircle } from 'lucide-react'
import { useChat } from '@/contexts/chat-context'
import { formatMessageTime, truncateMessage, getDisplayName } from '@/lib/chat'

export default function ChatSidebar() {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    chatList, 
    isLoadingChatList, 
    openChat,
    refreshChatList 
  } = useChat()

  // Refresh chat list when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      refreshChatList()
    }
  }, [isSidebarOpen, refreshChatList])

  if (!isSidebarOpen) return null

  const handleChatClick = (otherUserId: string, otherUserEmail: string) => {
    openChat(otherUserId, otherUserEmail)
  }

  const getUserInitials = (email: string | null) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        md:w-96
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingChatList ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading conversations...</span>
            </div>
          ) : chatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start chatting with property owners and flatmates by clicking &quot;Message Owner&quot; on listings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chatList.map((chat) => (
                <button
                  key={chat.other_user_id}
                  onClick={() => handleChatClick(chat.other_user_id, chat.other_user_email || '')}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-purple-500 text-white text-sm font-medium">
                          {getUserInitials(chat.other_user_email)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {chat.unread_count > 9 ? '9+' : chat.unread_count}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getDisplayName(chat.other_user_email)}
                        </h3>
                        {chat.latest_message_time && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatMessageTime(chat.latest_message_time)}
                          </span>
                        )}
                      </div>
                      
                      {chat.latest_message && (
                        <div className="flex items-center gap-1">
                          {chat.is_sender && (
                            <span className="text-xs text-gray-400">You:</span>
                          )}
                          <p className={`text-sm truncate ${
                            chat.unread_count > 0 && !chat.is_sender 
                              ? 'font-medium text-gray-900' 
                              : 'text-gray-600'
                          }`}>
                            {truncateMessage(chat.latest_message, 40)}
                          </p>
                        </div>
                      )}
                      
                      {!chat.latest_message && (
                        <p className="text-sm text-gray-400 italic">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Click on any conversation to start chatting
          </p>
        </div>
      </div>
    </>
  )
}