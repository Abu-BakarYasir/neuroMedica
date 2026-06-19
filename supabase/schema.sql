-- ============================================================
-- Persistent Chat Memory: conversations + messages
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Messages table
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

-- 3. Indexes
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- Full-text search index on message content (for conversation search)
create index if not exists idx_messages_content_search
  on public.messages using gin(to_tsvector('english', content));

-- 4. Row-Level Security
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: users can only access their own
create policy "Users can select own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages: users can access messages in their own conversations
create policy "Users can select messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in own conversations"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- 5. Auto-update updated_at on conversations when messages are added
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_conversation_timestamp
  after insert on public.messages
  for each row
  execute function public.update_conversation_timestamp();

-- ============================================================
-- Patients: manual patient registry (migration 003)
-- ============================================================

create table if not exists public.patients (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  phone           text,
  address         text,
  notes           text,
  date_of_birth   date,
  sex             text check (sex in ('male', 'female', 'other', 'unknown')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_patients_doctor_id  on public.patients(doctor_id);
create index if not exists idx_patients_created_at on public.patients(created_at desc);
create index if not exists idx_patients_name       on public.patients(lower(name));

alter table public.patients enable row level security;

create policy "Doctors can select own patients"
  on public.patients for select
  using (auth.uid() = doctor_id);

create policy "Doctors can insert own patients"
  on public.patients for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors can update own patients"
  on public.patients for update
  using (auth.uid() = doctor_id)
  with check (auth.uid() = doctor_id);

create policy "Doctors can delete own patients"
  on public.patients for delete
  using (auth.uid() = doctor_id);

create or replace function public.touch_patient_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_touch_patient_updated_at
  before update on public.patients
  for each row
  execute function public.touch_patient_updated_at();

-- ============================================================
-- Reports (saved clinical reports — see migration 004)
-- ============================================================

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references auth.users(id) on delete cascade,
  patient_id    uuid references public.patients(id) on delete set null,
  patient_name  text,
  title         text not null,
  notes         text,
  items         jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_reports_doctor_id  on public.reports(doctor_id);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_patient_id on public.reports(patient_id);

alter table public.reports enable row level security;

create policy "Doctors can select own reports"
  on public.reports for select
  using (auth.uid() = doctor_id);

create policy "Doctors can insert own reports"
  on public.reports for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors can update own reports"
  on public.reports for update
  using (auth.uid() = doctor_id)
  with check (auth.uid() = doctor_id);

create policy "Doctors can delete own reports"
  on public.reports for delete
  using (auth.uid() = doctor_id);

create or replace function public.touch_report_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_touch_report_updated_at
  before update on public.reports
  for each row
  execute function public.touch_report_updated_at();
