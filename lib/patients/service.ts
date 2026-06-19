"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  PatientInput,
  PatientRow,
  PrescriptionRow,
  UnifiedPatient,
} from "./types";

/** Normalise a name for deduping prescription-only patients against manual ones. */
function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

interface PrescriptionLite {
  id: string;
  patient_name: string | null;
  created_at: string;
}

/**
 * Fetch all patients owned by the current doctor.
 * Returns a merged list: every manual `patients` row, plus any patient names
 * that appear only in `prescriptions` (deduped by lowercased name).
 */
export async function listUnifiedPatients(): Promise<UnifiedPatient[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [manualRes, rxRes] = await Promise.all([
    supabase
      .from("patients")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("id, patient_name, created_at")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const manualRows: PatientRow[] = (manualRes.data ?? []) as PatientRow[];
  const prescriptions: PrescriptionLite[] =
    (rxRes.data ?? []) as PrescriptionLite[];

  // Group prescriptions by normalised name for counts/last seen.
  const rxByName = new Map<
    string,
    { displayName: string; count: number; lastAt: string }
  >();
  for (const p of prescriptions) {
    const raw = (p.patient_name ?? "").trim();
    if (!raw) continue;
    const key = normaliseName(raw);
    const existing = rxByName.get(key);
    if (existing) {
      existing.count += 1;
      if (p.created_at > existing.lastAt) existing.lastAt = p.created_at;
    } else {
      rxByName.set(key, {
        displayName: raw,
        count: 1,
        lastAt: p.created_at,
      });
    }
  }

  const result: UnifiedPatient[] = [];
  const manualKeys = new Set<string>();

  // Emit manual patients first, attaching prescription counts when names match.
  for (const row of manualRows) {
    const key = normaliseName(row.name);
    manualKeys.add(key);
    const rx = rxByName.get(key);
    result.push({
      source: "manual",
      row,
      prescriptionCount: rx?.count ?? 0,
      lastPrescriptionAt: rx?.lastAt ?? null,
    });
  }

  // Emit prescription-only patients (those without a matching manual record).
  for (const [key, rx] of rxByName.entries()) {
    if (manualKeys.has(key)) continue;
    result.push({
      source: "prescription",
      id: `rx:${key}`,
      name: rx.displayName,
      prescriptionCount: rx.count,
      lastPrescriptionAt: rx.lastAt,
    });
  }

  return result;
}

/**
 * Fetch the raw scanned prescriptions for a patient, matched by normalised name.
 * Used by the read-only patient detail dialog on the Patients page.
 */
export async function listPrescriptionsByName(
  name: string,
): Promise<PrescriptionRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, patient_name, prescription_date, medications, created_at")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const target = normaliseName(name);
  return ((data ?? []) as PrescriptionRow[]).filter(
    (p) => normaliseName(p.patient_name ?? "") === target,
  );
}

export async function createPatient(input: PatientInput): Promise<PatientRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to add a patient.");

  const payload = {
    doctor_id: user.id,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    date_of_birth: input.date_of_birth || null,
    sex: input.sex || null,
  };

  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PatientRow;
}

export async function updatePatient(
  id: string,
  input: PatientInput
): Promise<PatientRow> {
  const supabase = createClient();
  const payload = {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    date_of_birth: input.date_of_birth || null,
    sex: input.sex || null,
  };

  const { data, error } = await supabase
    .from("patients")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PatientRow;
}

export async function deletePatient(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
