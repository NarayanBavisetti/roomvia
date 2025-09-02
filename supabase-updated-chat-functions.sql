-- Updated chat functions to work with the new chat/messages schema structure
-- Run these functions in your Supabase SQL editor

-- Function to get or create a chat between two users
CREATE OR REPLACE FUNCTION get_or_create_chat(user1_id uuid, user2_id uuid, listing_id uuid DEFAULT NULL, flatmate_id uuid DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  chat_id uuid;
BEGIN
  -- Try to find existing chat between these users
  SELECT id INTO chat_id
  FROM chats 
  WHERE 
    (chats.user1_id = get_or_create_chat.user1_id AND chats.user2_id = get_or_create_chat.user2_id) OR
    (chats.user1_id = get_or_create_chat.user2_id AND chats.user2_id = get_or_create_chat.user1_id)
  LIMIT 1;
  
  -- If no chat exists, create one
  IF chat_id IS NULL THEN
    INSERT INTO chats (user1_id, user2_id, listing_id, flatmate_id)
    VALUES (get_or_create_chat.user1_id, get_or_create_chat.user2_id, get_or_create_chat.listing_id, get_or_create_chat.flatmate_id)
    RETURNING id INTO chat_id;
  END IF;
  
  RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation messages between two users
CREATE OR REPLACE FUNCTION get_conversation(user1_id uuid, user2_id uuid, page_size int DEFAULT 50, page_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  message_text text,
  created_at timestamptz,
  is_read boolean,
  sender_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    CASE 
      WHEN c.user1_id = m.sender_id THEN c.user2_id 
      ELSE c.user1_id 
    END as receiver_id,
    m.content as message_text,
    m.created_at,
    m.is_read,
    au.email as sender_email
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  LEFT JOIN auth.users au ON m.sender_id = au.id
  WHERE 
    (c.user1_id = get_conversation.user1_id AND c.user2_id = get_conversation.user2_id) OR
    (c.user1_id = get_conversation.user2_id AND c.user2_id = get_conversation.user1_id)
  ORDER BY m.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chat list for a user (latest message from each conversation)
CREATE OR REPLACE FUNCTION get_chat_list(user_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_user_email text,
  latest_message text,
  latest_message_time timestamptz,
  unread_count bigint,
  is_sender boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH user_chats AS (
    SELECT 
      c.id as chat_id,
      CASE 
        WHEN c.user1_id = get_chat_list.user_id THEN c.user2_id 
        ELSE c.user1_id 
      END as other_user_id
    FROM chats c
    WHERE c.user1_id = get_chat_list.user_id OR c.user2_id = get_chat_list.user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (uc.other_user_id)
      uc.other_user_id,
      m.content as message_text,
      m.created_at,
      m.sender_id = get_chat_list.user_id as is_sender
    FROM user_chats uc
    JOIN messages m ON m.chat_id = uc.chat_id
    ORDER BY uc.other_user_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      uc.other_user_id,
      COUNT(*) as unread_count
    FROM user_chats uc
    JOIN messages m ON m.chat_id = uc.chat_id
    WHERE m.sender_id != get_chat_list.user_id AND m.is_read = false
    GROUP BY uc.other_user_id
  )
  SELECT 
    lm.other_user_id,
    au.email as other_user_email,
    lm.message_text as latest_message,
    lm.created_at as latest_message_time,
    COALESCE(uc.unread_count, 0) as unread_count,
    lm.is_sender
  FROM latest_messages lm
  LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id
  LEFT JOIN auth.users au ON lm.other_user_id = au.id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(sender_user_id uuid, receiver_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = true
  WHERE chat_id IN (
    SELECT id FROM chats 
    WHERE 
      (user1_id = sender_user_id AND user2_id = receiver_user_id) OR
      (user1_id = receiver_user_id AND user2_id = sender_user_id)
  )
  AND sender_id = sender_user_id 
  AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message (helper function)
CREATE OR REPLACE FUNCTION send_message(receiver_id uuid, message_content text, listing_id uuid DEFAULT NULL, flatmate_id uuid DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  chat_id uuid;
  message_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get or create chat
  chat_id := get_or_create_chat(current_user_id, receiver_id, listing_id, flatmate_id);
  
  -- Insert message
  INSERT INTO messages (chat_id, sender_id, content)
  VALUES (chat_id, current_user_id, message_content)
  RETURNING id INTO message_id;
  
  -- Update chat's last message info
  UPDATE chats 
  SET 
    last_message = message_content,
    last_message_at = NOW()
  WHERE id = chat_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;