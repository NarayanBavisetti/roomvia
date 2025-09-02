-- Fix the chat constraint to allow general chats
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE chats DROP CONSTRAINT IF EXISTS check_one_reference;

-- Add a new, more flexible constraint that allows both to be null for general chats
ALTER TABLE chats ADD CONSTRAINT check_one_reference CHECK (
  -- Allow both to be null for general chats
  (listing_id IS NULL AND flatmate_id IS NULL) OR
  -- Or exactly one to be non-null for specific context chats
  (listing_id IS NOT NULL AND flatmate_id IS NULL) OR
  (listing_id IS NULL AND flatmate_id IS NOT NULL)
);