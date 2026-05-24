-- ============================================================
-- Migration: 003_create_patients
-- Description: Manual patient registry. Doctors can add patients directly
--              with name/contact/general info, independent of prescription scans.
--              Each row is owned by a single doctor (auth.users.id).
-- Author: assistant
-- Date: 2026-05-11
-- Depends on: 002_create_messages
--
-- Safety: [x] Idempotent  [x] Non-destructive  [x] Backward-compatible
-- ============================================================

begin;

-- 1. Patients table
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

-- 2. Indexes
create index if not exists idx_patients_doctor_id   on public.patients(doctor_id);
create index if not exists idx_patients_created_at  on public.patients(created_at desc);
create index if not exists idx_patients_name        on public.patients(lower(name));

-- 3. Row-Level Security — doctors only see/touch their own patients
alter table public.patients enable row level security;

drop policy if exists "Doctors can select own patients" on public.patients;
create policy "Doctors can select own patients"
  on public.patients for select
  using (auth.uid() = doctor_id);

drop policy if exists "Doctors can insert own patients" on public.patients;
create policy "Doctors can insert own patients"
  on public.patients for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can update own patients" on public.patients;
create policy "Doctors can update own patients"
  on public.patients for update
  using (auth.uid() = doctor_id)
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can delete own patients" on public.patients;
create policy "Doctors can delete own patients"
  on public.patients for delete
  using (auth.uid() = doctor_id);

-- 4. Auto-update `updated_at` on row changes
create or replace function public.touch_patient_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_patient_updated_at on public.patients;
create trigger trg_touch_patient_updated_at
  before update on public.patients
  for each row
  execute function public.touch_patient_updated_at();

commit;
