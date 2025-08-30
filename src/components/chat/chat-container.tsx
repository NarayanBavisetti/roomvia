'use client'

import { useChat } from '@/contexts/chat-context'
import ChatSidebar from './chat-sidebar'
import ChatWindow from './chat-window'

export default function ChatContainer() {
  const { chatWindows } = useChat()

  return (
    <>
      {/* Chat Sidebar */}
      <ChatSidebar />
      
      {/* Chat Windows */}
      <div className="fixed bottom-0 right-0 z-40">
        <div className="flex items-end gap-4 pr-4">
          {chatWindows.map((chat, index) => (
            <div 
              key={chat.id} 
              style={{ 
                transform: `translateX(-${index * (chat.isMinimized ? 280 : 0)}px)`,
                zIndex: 40 + chatWindows.length - index 
              }}
            >
              <ChatWindow chat={chat} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}