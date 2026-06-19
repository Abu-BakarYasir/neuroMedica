-- ============================================================
-- Migration: 004_create_reports
-- Description: Saved clinical reports. A report bundles captured outputs from
--              the clinical modules (ECG, chest X-ray, Medical Q&A, Symptom
--              Explorer) plus free-text notes, optionally tied to a patient.
--              Each row is owned by a single doctor (auth.users.id).
-- Author: assistant
-- Date: 2026-06-19
-- Depends on: 003_create_patients
--
-- Safety: [x] Idempotent  [x] Non-destructive  [x] Backward-compatible
-- ============================================================

begin;

-- 1. Reports table
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

-- 2. Indexes
create index if not exists idx_reports_doctor_id  on public.reports(doctor_id);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_patient_id on public.reports(patient_id);

-- 3. Row-Level Security — doctors only see/touch their own reports
alter table public.reports enable row level security;

drop policy if exists "Doctors can select own reports" on public.reports;
create policy "Doctors can select own reports"
  on public.reports for select
  using (auth.uid() = doctor_id);

drop policy if exists "Doctors can insert own reports" on public.reports;
create policy "Doctors can insert own reports"
  on public.reports for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can update own reports" on public.reports;
create policy "Doctors can update own reports"
  on public.reports for update
  using (auth.uid() = doctor_id)
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can delete own reports" on public.reports;
create policy "Doctors can delete own reports"
  on public.reports for delete
  using (auth.uid() = doctor_id);

-- 4. Auto-update `updated_at` on row changes
create or replace function public.touch_report_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_report_updated_at on public.reports;
create trigger trg_touch_report_updated_at
  before update on public.reports
  for each row
  execute function public.touch_report_updated_at();

commit;
