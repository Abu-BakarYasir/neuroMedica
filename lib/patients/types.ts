export type PatientSex = "male" | "female" | "other" | "unknown";

/** Database row shape (snake_case from Supabase). */
export interface PatientRow {
  id: string;
  doctor_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  date_of_birth: string | null; // ISO date (YYYY-MM-DD)
  sex: PatientSex | null;
  created_at: string;
  updated_at: string;
}

/** Form payload — the doctor never sets doctor_id or timestamps. */
export interface PatientInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  date_of_birth?: string | null;
  sex?: PatientSex | null;
}

/** A single medication line extracted from a scanned prescription. */
export interface Medication {
  medicine_name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
}

/** A row from the `prescriptions` table (scanned/OCR'd prescriptions). */
export interface PrescriptionRow {
  id: string;
  patient_name: string | null;
  prescription_date: string | null;
  medications: Medication[];
  created_at: string;
}

/**
 * A unified "patient" the UI displays.
 * - "manual" rows come from the `patients` table.
 * - "prescription" rows are derived from `prescriptions` and have no patient row of their own.
 */
export type UnifiedPatient =
  | {
      source: "manual";
      row: PatientRow;
      prescriptionCount: number;
      lastPrescriptionAt: string | null;
    }
  | {
      source: "prescription";
      // Synthetic id (we use the patient name normalised) for React keys.
      id: string;
      name: string;
      prescriptionCount: number;
      lastPrescriptionAt: string | null;
    };
