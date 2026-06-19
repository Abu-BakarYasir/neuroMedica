"use client";

import { createClient } from "@/lib/supabase/client";
import type { ReportInput, ReportRow } from "./types";

export async function listReports(): Promise<ReportRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReportRow[];
}

export async function createReport(input: ReportInput): Promise<ReportRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to save a report.");

  const payload = {
    doctor_id: user.id,
    title: input.title.trim(),
    patient_id: input.patient_id ?? null,
    patient_name: input.patient_name?.trim() || null,
    notes: input.notes?.trim() || null,
    items: input.items,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ReportRow;
}

export async function deleteReport(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
