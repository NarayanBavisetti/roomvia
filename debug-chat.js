// Debug script to test chat functionality
// Run this in browser console to test message sending

async function debugChatSending() {
  console.log('🔍 Starting chat debug...')
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  console.log('👤 Current user:', user?.id, user?.email)
  
  if (!user) {
    console.error('❌ User not authenticated')
    return
  }
  
  // Test parameters (replace with actual values)
  const receiverId = 'REPLACE_WITH_ACTUAL_RECEIVER_ID' // Replace this
  const messageText = 'Test message'
  const listingId = 'REPLACE_WITH_ACTUAL_LISTING_ID' // Replace this
  
  console.log('📤 Attempting to send message...')
  console.log('📋 Parameters:', { receiverId, messageText, listingId })
  
  try {
    // Step 1: Check for existing chat
    console.log('🔍 Step 1: Looking for existing chat...')
    
    let { data: existingChat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('user1_id', user.id)
      .eq('user2_id', receiverId)
      .single()
    
    console.log('💬 Chat search result 1:', { existingChat, chatError })
    
    // Try reverse direction
    if (chatError && chatError.code === 'PGRST116') {
      console.log('🔄 Trying reverse direction...')
      const result = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', receiverId)
        .eq('user2_id', user.id)
        .single()
      
      existingChat = result.data
      chatError = result.error
      console.log('💬 Chat search result 2:', { existingChat, chatError })
    }
    
    let chatId
    
    // Step 2: Create chat if needed
    if (chatError && chatError.code === 'PGRST116') {
      console.log('➕ Step 2: Creating new chat...')
      
      const insertData = {
        user1_id: user.id,
        user2_id: receiverId,
        last_message: messageText,
        last_message_at: new Date().toISOString()
      }
      
      if (listingId) {
        insertData.listing_id = listingId
      }
      
      console.log('📝 Insert data:', insertData)
      
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert(insertData)
        .select('id')
        .single()
      
      console.log('💬 Chat creation result:', { newChat, createError })
      
      if (createError) {
        console.error('❌ Chat creation failed:', createError)
        return
      }
      chatId = newChat.id
    } else if (chatError) {
      console.error('❌ Chat lookup failed:', chatError)
      return
    } else {
      chatId = existingChat.id
      console.log('✅ Using existing chat:', chatId)
    }
    
    // Step 3: Send message
    console.log('📨 Step 3: Sending message...')
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: messageText,
      })
    
    console.log('📨 Message send result:', { messageError })
    
    if (messageError) {
      console.error('❌ Message sending failed:', messageError)
    } else {
      console.log('✅ Message sent successfully!')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Instructions:
console.log(`
🚀 To debug chat functionality:

1. Replace 'REPLACE_WITH_ACTUAL_RECEIVER_ID' with the actual receiver user ID
2. Replace 'REPLACE_WITH_ACTUAL_LISTING_ID' with the actual listing ID  
3. Run: debugChatSending()

This will show you exactly where the process is failing.
`)