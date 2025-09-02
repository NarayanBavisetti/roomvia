-- Debug script for messages RLS issues
-- Run this in Supabase SQL Editor to investigate and temporarily fix RLS

-- 1. Check current RLS policies on messages table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- 2. Check if messages table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 3. TEMPORARY: Disable RLS on messages table for testing
-- WARNING: This removes security - only for debugging!
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 4. Alternative: Create a more permissive policy for testing
-- DROP POLICY IF EXISTS "Users can send messages" ON messages;
-- CREATE POLICY "Allow all authenticated users to send messages" ON messages
--   FOR INSERT TO authenticated
--   WITH CHECK (true);

-- 5. Check current auth context (run this when logged in)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 6. To re-enable RLS later:
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. To restore original policy:
-- DROP POLICY IF EXISTS "Allow all authenticated users to send messages" ON messages;
-- CREATE POLICY "Users can send messages" ON messages
--   FOR INSERT WITH CHECK (auth.uid() = sender_id);