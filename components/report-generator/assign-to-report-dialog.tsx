"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FilePlus2,
  FileText,
  Loader2,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import {
  createPatient,
  listUnifiedPatients,
} from "@/lib/patients/service";
import { createReport, listReports, updateReport } from "@/lib/report/service";
import { validatePhone } from "@/lib/validation/phone";
import type { PatientSex, UnifiedPatient } from "@/lib/patients/types";
import type { ReportItem, ReportRow } from "@/lib/report/types";

interface AssignToReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Serializes the current module result into a report section when assigning. */
  build: () => ReportItem;
}

type Step = "patient" | "destination" | "done";

/** A patient resolved to the fields we need to assign a report. */
interface ResolvedPatient {
  /** UUID for manual patients; null for prescription-only patients. */
  id: string | null;
  name: string;
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function unifiedToResolved(p: UnifiedPatient): ResolvedPatient {
  return p.source === "manual"
    ? { id: p.row.id, name: p.row.name }
    : { id: null, name: p.name };
}

function fmtDate(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

const SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Prefer not to say" },
];

export function AssignToReportDialog({
  open,
  onOpenChange,
  build,
}: AssignToReportDialogProps) {
  const [step, setStep] = useState<Step>("patient");

  // Patient list + search
  const [patients, setPatients] = useState<UnifiedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [query, setQuery] = useState("");

  // New-patient inline form
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [npName, setNpName] = useState("");
  const [npDob, setNpDob] = useState("");
  const [npSex, setNpSex] = useState<PatientSex | "">("");
  const [npPhone, setNpPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  // Destination step
  const [patient, setPatient] = useState<ResolvedPatient | null>(null);
  const [patientReports, setPatientReports] = useState<ReportRow[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [destination, setDestination] = useState<"new" | string>("new");
  const [newTitle, setNewTitle] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");

  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneName, setDoneName] = useState("");

  // Reset everything whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStep("patient");
    setQuery("");
    setShowNewPatient(false);
    setNpName("");
    setNpDob("");
    setNpSex("");
    setNpPhone("");
    setPatient(null);
    setPatientReports([]);
    setDestination("new");
    setError(null);
    setDoneName("");

    setLoadingPatients(true);
    listUnifiedPatients()
      .then(setPatients)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load patients."),
      )
      .finally(() => setLoadingPatients(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = p.source === "manual" ? p.row.name : p.name;
      const phone = p.source === "manual" ? p.row.phone ?? "" : "";
      return name.toLowerCase().includes(q) || phone.toLowerCase().includes(q);
    });
  }, [patients, query]);

  const goToDestination = async (resolved: ResolvedPatient) => {
    setPatient(resolved);
    setError(null);
    setDestination("new");
    setStep("destination");

    // Default title from the section being added.
    const peek = build();
    setSectionTitle(peek.title);
    setNewTitle(`${peek.title} — ${resolved.name} — ${fmtDate(new Date().toISOString())}`);

    setLoadingReports(true);
    try {
      const all = await listReports();
      const key = normaliseName(resolved.name);
      const mine = all.filter((r) =>
        resolved.id
          ? r.patient_id === resolved.id
          : normaliseName(r.patient_name ?? "") === key,
      );
      setPatientReports(mine);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load existing reports.");
      setPatientReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleCreatePatient = async () => {
    if (creatingPatient) return;
    if (!npName.trim()) {
      setError("Patient name is required.");
      return;
    }
    const phoneError = validatePhone(npPhone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    setCreatingPatient(true);
    setError(null);
    try {
      const row = await createPatient({
        name: npName,
        date_of_birth: npDob || null,
        sex: npSex || null,
        phone: npPhone || null,
      });
      await goToDestination({ id: row.id, name: row.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create patient.");
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleAssign = async () => {
    if (!patient || assigning) return;
    setAssigning(true);
    setError(null);
    try {
      const item = build();
      if (destination === "new") {
        await createReport({
          title: newTitle.trim() || sectionTitle,
          patient_id: patient.id,
          patient_name: patient.name,
          items: [item],
        });
      } else {
        const target = patientReports.find((r) => r.id === destination);
        if (!target) throw new Error("That report no longer exists.");
        await updateReport(destination, {
          items: [...(target.items ?? []), item],
        });
      }
      setDoneName(patient.name);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign to report.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FilePlus2 className="w-4 h-4 text-neuro-primary" />
            {step === "done" ? "Added to report" : "Add to a patient's report"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 -mt-1">{error}</p>
        )}

        {/* STEP 1 — choose patient */}
        {step === "patient" && (
          <>
            {!showNewPatient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search patients by name or phone…"
                    className="pl-8 h-9 text-sm"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto -mx-2 px-2 min-h-[180px]">
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-10 text-center">
                      {query
                        ? "No patients match that search."
                        : "No patients yet — create one below."}
                    </p>
                  ) : (
                    <ul className="space-y-1.5 py-1">
                      {filtered.map((p) => {
                        const r = unifiedToResolved(p);
                        const isManual = p.source === "manual";
                        return (
                          <li key={isManual ? p.row.id : p.id}>
                            <button
                              type="button"
                              onClick={() => goToDestination(r)}
                              className="w-full text-left flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted hover:border-neuro-primary/40"
                            >
                              <div className="h-9 w-9 rounded-full bg-neuro-primary/10 text-neuro-primary flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {r.name || "Unknown"}
                                  </p>
                                  <span className="text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                    {isManual ? "Manual" : "From Rx"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {p.prescriptionCount > 0
                                    ? `${p.prescriptionCount} prescription${p.prescriptionCount === 1 ? "" : "s"}`
                                    : "No prescriptions yet"}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setShowNewPatient(true);
                    }}
                    className="gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    New patient
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              /* Inline new-patient form */
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="np-name" className="text-xs font-medium">
                    Full name <span className="text-neuro-primary">*</span>
                  </Label>
                  <Input
                    id="np-name"
                    value={npName}
                    onChange={(e) => setNpName(e.target.value)}
                    placeholder="Jane Doe"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="np-dob" className="text-xs font-medium">
                      Date of birth
                    </Label>
                    <Input
                      id="np-dob"
                      type="date"
                      value={npDob}
                      onChange={(e) => setNpDob(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="np-sex" className="text-xs font-medium">
                      Sex
                    </Label>
                    <select
                      id="np-sex"
                      value={npSex}
                      onChange={(e) => setNpSex(e.target.value as PatientSex | "")}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Not specified</option>
                      {SEX_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="np-phone" className="text-xs font-medium">
                    Phone
                  </Label>
                  <Input
                    id="np-phone"
                    type="tel"
                    inputMode="tel"
                    value={npPhone}
                    onChange={(e) => setNpPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setShowNewPatient(false);
                    }}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreatePatient}
                    disabled={creatingPatient || !npName.trim()}
                    className="bg-neuro-primary hover:bg-neuro-primary/90 text-white gap-1.5"
                  >
                    {creatingPatient ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Create &amp; continue
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2 — choose destination */}
        {step === "destination" && patient && (
          <div className="space-y-3 flex-1 overflow-y-auto -mx-1 px-1">
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <User className="w-4 h-4 text-neuro-primary" />
              <span className="text-sm font-medium text-foreground">{patient.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Adding: {sectionTitle}
              </span>
            </div>

            {/* New report */}
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-neuro-primary/40 transition-colors">
              <input
                type="radio"
                name="destination"
                checked={destination === "new"}
                onChange={() => setDestination("new")}
                className="mt-1 accent-[var(--neuro-primary,#F47325)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <FilePlus2 className="w-3.5 h-3.5 text-neuro-primary" />
                  Create new report
                </div>
                {destination === "new" && (
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Report title"
                    className="mt-2 h-9 text-sm"
                  />
                )}
              </div>
            </label>

            {/* Existing reports */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                Or add to an existing report
              </div>
              {loadingReports ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              ) : patientReports.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
                  No existing reports for this patient.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {patientReports.map((r) => (
                    <li key={r.id}>
                      <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-neuro-primary/40 transition-colors">
                        <input
                          type="radio"
                          name="destination"
                          checked={destination === r.id}
                          onChange={() => setDestination(r.id)}
                          className="mt-1 accent-[var(--neuro-primary,#F47325)]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{r.title}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(r.created_at)} · {(r.items?.length ?? 0)} section
                            {(r.items?.length ?? 0) === 1 ? "" : "s"}
                          </div>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border sticky bottom-0 bg-card">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("patient")}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAssign}
                disabled={assigning}
                className="bg-neuro-primary hover:bg-neuro-primary/90 text-white gap-1.5"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Assign
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — done */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Added to {doneName}&apos;s report
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open the Report Generator to view, edit, or export it.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Link href="/protected/report-generator">
                <Button
                  size="sm"
                  className="bg-neuro-primary hover:bg-neuro-primary/90 text-white gap-1.5"
                  onClick={() => onOpenChange(false)}
                >
                  <FileText className="w-4 h-4" />
                  Open Report Generator
                </Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
