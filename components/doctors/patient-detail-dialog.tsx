"use client";

import { useEffect, useState } from "react";
import { Loader2, Pill, Phone, MapPin, CalendarDays, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { listPrescriptionsByName } from "@/lib/patients/service";
import type { PrescriptionRow, UnifiedPatient } from "@/lib/patients/types";

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export function PatientDetailDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient: UnifiedPatient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isManual = patient.source === "manual";
  const name = isManual ? patient.row.name : patient.name;

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    listPrescriptionsByName(name)
      .then((rows) => {
        if (active) setPrescriptions(rows);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load prescriptions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {name}
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded",
                isManual
                  ? "bg-neuro-primary/10 text-neuro-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isManual ? "Manual" : "From prescription"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Manual patient fields */}
          {isManual && (
            <div className="space-y-1.5 text-xs text-foreground/80">
              {patient.row.phone && <Detail icon={Phone} text={patient.row.phone} />}
              {patient.row.address && <Detail icon={MapPin} text={patient.row.address} />}
              {(patient.row.date_of_birth || patient.row.sex) && (
                <Detail
                  icon={CalendarDays}
                  text={[
                    formatDate(patient.row.date_of_birth),
                    patient.row.sex && patient.row.sex !== "unknown"
                      ? patient.row.sex
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
              {patient.row.notes && (
                <Detail icon={FileText} text={patient.row.notes} />
              )}
            </div>
          )}

          {/* Scanned prescriptions */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
              <Pill className="w-4 h-4 text-neuro-primary" />
              Scanned prescriptions
              {!loading && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({prescriptions.length})
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading prescriptions…
              </div>
            ) : error ? (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            ) : prescriptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No scanned prescriptions for this patient yet.
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrescriptionCard({ rx }: { rx: PrescriptionRow }) {
  const meds = Array.isArray(rx.medications) ? rx.medications : [];
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-2">
        {formatDate(rx.prescription_date) ?? "Date unknown"}
        {" · scanned "}
        {formatDate(rx.created_at)}
      </div>
      {meds.length === 0 ? (
        <p className="text-xs text-muted-foreground">No medications extracted.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="font-medium pb-1">Medicine</th>
              <th className="font-medium pb-1">Dosage</th>
              <th className="font-medium pb-1">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={i} className="border-t border-border/60">
                <td className="py-1 pr-2 text-foreground">{m.medicine_name || "—"}</td>
                <td className="py-1 pr-2 text-foreground/80">{m.dosage || "—"}</td>
                <td className="py-1 text-foreground/80">{m.frequency || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}
