"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Search, User } from "lucide-react";
import type { PrescriptionAttachment } from "@/lib/chatbot/attachments";

interface PrescriptionRow {
  id: string;
  patient_name: string | null;
  prescription_date: string | null;
  created_at: string;
  medications: Array<{
    medicine_name?: string | null;
    dosage?: string | null;
    frequency?: string | null;
  }> | null;
}

interface PrescriptionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Records already attached — disabled in the list to prevent duplicates. */
  alreadyAttachedIds: string[];
  onSelect: (attachment: PrescriptionAttachment) => void;
}

export function PrescriptionPicker({
  open,
  onOpenChange,
  alreadyAttachedIds,
  onSelect,
}: PrescriptionPickerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setError("You must be signed in.");
          return;
        }
        const { data, error: fetchErr } = await supabase
          .from("prescriptions")
          .select("id, patient_name, prescription_date, created_at, medications")
          .eq("doctor_id", user.id)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (fetchErr) {
          setError(fetchErr.message);
          return;
        }
        setRows((data ?? []) as PrescriptionRow[]);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.patient_name ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const handleSelect = (row: PrescriptionRow) => {
    const attachment: PrescriptionAttachment = {
      id: crypto.randomUUID(),
      kind: "prescription",
      recordId: row.id,
      patientName: row.patient_name || "Unknown",
      prescriptionDate: row.prescription_date,
      createdAt: row.created_at,
      medications: row.medications ?? [],
    };
    onSelect(attachment);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-neuro-primary" />
            Attach a saved prescription
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name…"
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
                ? "No prescriptions match that search."
                : "You haven't saved any prescriptions yet. Scan one from the Patient Management section."}
            </p>
          ) : (
            <ul className="space-y-1.5 py-1">
              {filtered.map((row) => {
                const alreadyAttached = alreadyAttachedIds.includes(row.id);
                const medCount = (row.medications ?? []).length;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => !alreadyAttached && handleSelect(row)}
                      disabled={alreadyAttached}
                      className={[
                        "w-full text-left flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                        alreadyAttached
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-muted hover:border-neuro-primary/40",
                      ].join(" ")}
                    >
                      <div className="h-9 w-9 rounded-full bg-neuro-primary/10 text-neuro-primary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {row.patient_name || "Unknown"}
                          </p>
                          {alreadyAttached && (
                            <span className="text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              Attached
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.prescription_date
                            ? `Rx ${row.prescription_date}`
                            : "Date unknown"}
                          {" · "}
                          {medCount} medication{medCount === 1 ? "" : "s"}
                          {" · "}
                          digitized {new Date(row.created_at).toLocaleDateString()}
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
