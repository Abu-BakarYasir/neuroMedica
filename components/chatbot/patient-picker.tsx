"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User } from "lucide-react";
import {
  listUnifiedPatients,
  listPrescriptionsByName,
} from "@/lib/patients/service";
import type { UnifiedPatient } from "@/lib/patients/types";
import type { PatientAttachment } from "@/lib/chatbot/attachments";

interface PatientPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Patient ids already attached — disabled in the list to prevent duplicates. */
  alreadyAttachedIds: string[];
  onSelect: (attachment: PatientAttachment) => void;
}

/** Stable id + display fields for a unified patient, regardless of source. */
function patientId(p: UnifiedPatient): string {
  return p.source === "manual" ? p.row.id : p.id;
}
function patientName(p: UnifiedPatient): string {
  return p.source === "manual" ? p.row.name : p.name;
}

export function PatientPicker({
  open,
  onOpenChange,
  alreadyAttachedIds,
  onSelect,
}: PatientPickerProps) {
  const [rows, setRows] = useState<UnifiedPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await listUnifiedPatients();
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load patients.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset the search box each time the picker opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const name = patientName(p);
      const phone = p.source === "manual" ? p.row.phone ?? "" : "";
      return (
        name.toLowerCase().includes(q) || phone.toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const handleSelect = async (p: UnifiedPatient) => {
    const name = patientName(p);
    setSelectingId(patientId(p));
    setError(null);
    try {
      // Pull the scanned prescription history so the model gets the full picture.
      const prescriptions = await listPrescriptionsByName(name);
      const attachment: PatientAttachment = {
        id: crypto.randomUUID(),
        kind: "patient",
        patientId: patientId(p),
        name,
        source: p.source,
        dateOfBirth: p.source === "manual" ? p.row.date_of_birth : null,
        sex: p.source === "manual" ? p.row.sex : null,
        phone: p.source === "manual" ? p.row.phone : null,
        address: p.source === "manual" ? p.row.address : null,
        notes: p.source === "manual" ? p.row.notes : null,
        prescriptionCount: p.prescriptionCount,
        lastPrescriptionAt: p.lastPrescriptionAt,
        prescriptions: prescriptions.map((rx) => ({
          prescriptionDate: rx.prescription_date,
          createdAt: rx.created_at,
          medications: rx.medications ?? [],
        })),
      };
      onSelect(attachment);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient details.");
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4 text-neuro-primary" />
            Attach a patient record
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone…"
            className="pl-8 h-9 text-sm"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400 py-6 text-center">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {query
                ? "No patients match that search."
                : "You haven't added any patients yet. Add one from the Patients section."}
            </p>
          ) : (
            <ul className="space-y-1.5 py-1">
              {filtered.map((p) => {
                const id = patientId(p);
                const name = patientName(p);
                const alreadyAttached = alreadyAttachedIds.includes(id);
                const isSelecting = selectingId === id;
                const isManual = p.source === "manual";
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() =>
                        !alreadyAttached && !selectingId && handleSelect(p)
                      }
                      disabled={alreadyAttached || isSelecting}
                      className={[
                        "w-full text-left flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                        alreadyAttached
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-muted hover:border-neuro-primary/40",
                      ].join(" ")}
                    >
                      <div className="h-9 w-9 rounded-full bg-neuro-primary/10 text-neuro-primary flex items-center justify-center shrink-0">
                        {isSelecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {name || "Unknown"}
                          </p>
                          <span className="text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {isManual ? "Manual" : "From Rx"}
                          </span>
                          {alreadyAttached && (
                            <span className="text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              Attached
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.prescriptionCount > 0
                            ? `${p.prescriptionCount} prescription${
                                p.prescriptionCount === 1 ? "" : "s"
                              }`
                            : "No prescriptions yet"}
                          {p.lastPrescriptionAt && (
                            <>
                              {" · last "}
                              {new Date(
                                p.lastPrescriptionAt
                              ).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
