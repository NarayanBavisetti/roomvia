-- Fix missing DELETE policy for user_search_filters table
-- This allows users to delete their own filter records

drop policy if exists "user_filters_delete_own" on public.user_search_filters;
create policy "user_filters_delete_own" on public.user_search_filters
  for delete using (auth.uid() = user_id);