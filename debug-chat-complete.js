// Complete chat debugging script
// Open browser dev tools, go to Console tab, paste this code and run it

window.debugChat = {
  async testChatFlow() {
    console.log('🚀 Starting complete chat flow test...')
    
    // Step 1: Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Current user:', user?.id, user?.email)
    
    if (!user) {
      console.error('❌ User not authenticated')
      return
    }
    
    // Step 2: Test sending a message
    const receiverId = prompt('Enter receiver user ID (copy from another user):')
    const listingId = prompt('Enter listing ID (optional):')
    const messageText = 'Test message from debug script'
    
    if (!receiverId) {
      console.error('❌ Receiver ID is required')
      return
    }
    
    console.log('📤 Testing sendMessage...')
    const sendResult = await chatService.sendMessage(receiverId, messageText, listingId)
    console.log('📨 Send result:', sendResult)
    
    if (sendResult.error) {
      console.error('❌ Send failed:', sendResult.error)
      return
    }
    
    // Step 3: Test getting chat list
    console.log('📋 Testing getChatList...')
    const listResult = await chatService.getChatList()
    console.log('📋 Chat list result:', listResult)
    
    if (listResult.error) {
      console.error('❌ Chat list failed:', listResult.error)
      return
    }
    
    console.log(`✅ Found ${listResult.data?.length || 0} chats`)
    
    // Step 4: Test getting conversation
    if (listResult.data && listResult.data.length > 0) {
      const firstChat = listResult.data[0]
      console.log('💬 Testing getConversation with first chat...')
      
      const convResult = await chatService.getConversation(firstChat.other_user_id)
      console.log('💬 Conversation result:', convResult)
      
      if (convResult.error) {
        console.error('❌ Get conversation failed:', convResult.error)
      } else {
        console.log(`✅ Found ${convResult.data?.length || 0} messages`)
      }
    }
    
    console.log('🎉 Chat flow test complete!')
  },
  
  async checkChatData() {
    console.log('🔍 Checking chat data directly...')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ User not authenticated')
      return
    }
    
    // Check chats table
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    
    console.log('💬 User chats:', chats, chatsError)
    
    // Check messages table
    if (chats && chats.length > 0) {
      for (const chat of chats) {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
        
        console.log(`📨 Messages for chat ${chat.id}:`, messages, messagesError)
      }
    }
  },
  
  async openChatWindow(otherUserId, listingId) {
    console.log('🪟 Testing chat window opening...')
    
    // This simulates clicking "Start Chat" button
    const otherUserEmail = `user_${otherUserId}@example.com`
    
    // Call the openChat function (you'll need to have the chat context available)
    if (window.chatContext) {
      await window.chatContext.openChat(otherUserId, otherUserEmail, listingId)
      console.log('✅ Chat window opened')
    } else {
      console.log('ℹ️ Chat context not available. Try this on a page with chat functionality.')
    }
  }
}

console.log(`
🛠️ Chat debugging tools loaded!

Available commands:
1. debugChat.testChatFlow() - Test complete chat functionality
2. debugChat.checkChatData() - Check chat data in database  
3. debugChat.openChatWindow(otherUserId, listingId) - Test opening chat window

Usage:
- debugChat.testChatFlow() // Follow prompts
- debugChat.checkChatData() // Check your chat data
`)

// Auto-run basic checks
debugChat.checkChatData()