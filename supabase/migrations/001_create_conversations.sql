-- ============================================================
-- Migration: 001_create_conversations
-- Description: Create conversations table for persistent chat history
-- Author: neuroMedica team
-- Date: 2026-03-28
-- Depends on: none
--
-- Safety: [x] Idempotent  [x] Non-destructive  [x] Backward-compatible
-- ============================================================

begin;

  -- Table
  create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'New Chat',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Indexes
  create index if not exists idx_conversations_user_id
    on public.conversations(user_id);

  create index if not exists idx_conversations_updated_at
    on public.conversations(updated_at desc);

  -- RLS
  alter table public.conversations enable row level security;

  do $$
  begin
    if not exists (
      select 1 from pg_policies
      where tablename = 'conversations' and policyname = 'Users can select own conversations'
    ) then
      create policy "Users can select own conversations"
        on public.conversations for select
        using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename = 'conversations' and policyname = 'Users can insert own conversations'
    ) then
      create policy "Users can insert own conversations"
        on public.conversations for insert
        with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename = 'conversations' and policyname = 'Users can update own conversations'
    ) then
      create policy "Users can update own conversations"
        on public.conversations for update
        using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename = 'conversations' and policyname = 'Users can delete own conversations'
    ) then
      create policy "Users can delete own conversations"
        on public.conversations for delete
        using (auth.uid() = user_id);
    end if;
  end $$;

commit;
