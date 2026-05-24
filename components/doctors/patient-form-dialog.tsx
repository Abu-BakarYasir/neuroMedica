"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createPatient,
  updatePatient,
} from "@/lib/patients/service";
import type { PatientInput, PatientRow, PatientSex } from "@/lib/patients/types";

interface PatientFormDialogProps {
  /** Pass an existing row to put the dialog into edit mode. */
  patient?: PatientRow;
  /** Element that opens the dialog. If omitted, parent must control `open`. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (row: PatientRow) => void;
}

const SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Prefer not to say" },
];

const EMPTY: PatientInput = {
  name: "",
  phone: "",
  address: "",
  notes: "",
  date_of_birth: "",
  sex: null,
};

function rowToInput(row: PatientRow): PatientInput {
  return {
    name: row.name,
    phone: row.phone ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    date_of_birth: row.date_of_birth ?? "",
    sex: row.sex,
  };
}

export function PatientFormDialog({
  patient,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: PatientFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<PatientInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(patient);

  // Reset form whenever the dialog opens or the edit target changes
  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(patient ? rowToInput(patient) : EMPTY);
  }, [open, patient]);

  const update = <K extends keyof PatientInput>(key: K, value: PatientInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = isEdit
        ? await updatePatient(patient!.id, form)
        : await createPatient(form);
      onSaved?.(saved);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save patient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[560px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {isEdit ? (
              <>
                <Save className="w-4 h-4 text-neuro-primary" />
                Edit patient
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-neuro-primary" />
                Add a patient
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="patient-name" className="text-xs font-medium">
              Full name <span className="text-neuro-primary">*</span>
            </Label>
            <Input
              id="patient-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Jane Doe"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="patient-dob" className="text-xs font-medium">
                Date of birth
              </Label>
              <Input
                id="patient-dob"
                type="date"
                value={form.date_of_birth ?? ""}
                onChange={(e) => update("date_of_birth", e.target.value || null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="patient-sex" className="text-xs font-medium">
                Sex
              </Label>
              <select
                id="patient-sex"
                value={form.sex ?? ""}
                onChange={(e) =>
                  update("sex", (e.target.value || null) as PatientSex | null)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Not specified</option>
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="patient-phone" className="text-xs font-medium">
              Phone
            </Label>
            <Input
              id="patient-phone"
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="patient-address" className="text-xs font-medium">
              Address
            </Label>
            <Input
              id="patient-address"
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="patient-notes" className="text-xs font-medium">
              General info / notes
            </Label>
            <textarea
              id="patient-notes"
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Allergies, chronic conditions, preferred pharmacy, etc."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="bg-neuro-primary hover:bg-neuro-primary-dark text-white gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add patient
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
