-- ============================================================
-- Migration: 002_create_messages
-- Description: Create messages table with RLS, full-text search, and auto-update trigger
-- Author: neuroMedica team
-- Date: 2026-03-28
-- Depends on: 001_create_conversations
--
-- Safety: [x] Idempotent  [x] Non-destructive  [x] Backward-compatible
-- ============================================================

begin;

  -- Table
  create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    used_rag boolean not null default false,
    citations jsonb,
    confidence text,
    disclaimer text,
    created_at timestamptz not null default now()
  );

  -- Indexes
  create index if not exists idx_messages_conversation_id
    on public.messages(conversation_id);

  create index if not exists idx_messages_created_at
    on public.messages(created_at asc);

  -- Full-text search index for conversation search
  create index if not exists idx_messages_content_search
    on public.messages using gin(to_tsvector('english', content));

  -- RLS
  alter table public.messages enable row level security;

  do $$
  begin
    if not exists (
      select 1 from pg_policies
      where tablename = 'messages' and policyname = 'Users can select messages in own conversations'
    ) then
      create policy "Users can select messages in own conversations"
        on public.messages for select
        using (
          exists (
            select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid()
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename = 'messages' and policyname = 'Users can insert messages in own conversations'
    ) then
      create policy "Users can insert messages in own conversations"
        on public.messages for insert
        with check (
          exists (
            select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid()
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where tablename = 'messages' and policyname = 'Users can delete messages in own conversations'
    ) then
      create policy "Users can delete messages in own conversations"
        on public.messages for delete
        using (
          exists (
            select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid()
          )
        );
    end if;
  end $$;

  -- Trigger: auto-update conversation.updated_at when a message is inserted
  create or replace function public.update_conversation_timestamp()
  returns trigger as $$
  begin
    update public.conversations
    set updated_at = now()
    where id = NEW.conversation_id;
    return NEW;
  end;
  $$ language plpgsql security definer;

  -- Drop and recreate trigger to ensure idempotency
  drop trigger if exists trg_update_conversation_timestamp on public.messages;

  create trigger trg_update_conversation_timestamp
    after insert on public.messages
    for each row
    execute function public.update_conversation_timestamp();

commit;
