-- Messages table for chat functionality
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Add indexes for performance
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see messages where they are sender or receiver
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert messages where they are the sender
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can only update their own sent messages (for read receipts)
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enable realtime for messages table
ALTER publication supabase_realtime ADD TABLE messages;

-- Function to get conversation between two users
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
    m.receiver_id,
    m.message_text,
    m.created_at,
    m.is_read,
    au.email as sender_email
  FROM messages m
  LEFT JOIN auth.users au ON m.sender_id = au.id
  WHERE 
    (m.sender_id = user1_id AND m.receiver_id = user2_id) OR
    (m.sender_id = user2_id AND m.receiver_id = user1_id)
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
  WITH conversations AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = user_id THEN receiver_id 
        ELSE sender_id 
      END as other_user_id
    FROM messages 
    WHERE sender_id = user_id OR receiver_id = user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN sender_id = user_id THEN receiver_id 
        ELSE sender_id 
      END
    )
      CASE 
        WHEN sender_id = user_id THEN receiver_id 
        ELSE sender_id 
      END as other_user_id,
      message_text,
      created_at,
      sender_id = user_id as is_sender
    FROM messages 
    WHERE sender_id = user_id OR receiver_id = user_id
    ORDER BY 
      CASE 
        WHEN sender_id = user_id THEN receiver_id 
        ELSE sender_id 
      END,
      created_at DESC
  ),
  unread_counts AS (
    SELECT 
      sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages 
    WHERE receiver_id = user_id AND is_read = false
    GROUP BY sender_id
  )
  SELECT 
    c.other_user_id,
    au.email as other_user_email,
    lm.message_text as latest_message,
    lm.created_at as latest_message_time,
    COALESCE(uc.unread_count, 0) as unread_count,
    lm.is_sender
  FROM conversations c
  LEFT JOIN latest_messages lm ON c.other_user_id = lm.other_user_id
  LEFT JOIN unread_counts uc ON c.other_user_id = uc.other_user_id
  LEFT JOIN auth.users au ON c.other_user_id = au.id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(sender_user_id uuid, receiver_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = true, updated_at = now()
  WHERE sender_id = sender_user_id 
    AND receiver_id = receiver_user_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on message updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at 
BEFORE UPDATE ON messages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();