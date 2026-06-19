"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { patientManagementContent } from "@/lib/doctor-content";
import { Plus, UploadCloud, Loader2, FileText, Search, User, Trash2, UserPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PatientFormDialog } from "./patient-form-dialog";
import type { PatientRow } from "@/lib/patients/types";

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  const iconMap = {
    up: "/assets/icons/green.svg",
    down: "/assets/icons/red.svg",
    neutral: "/assets/icons/trend-neutral-blue.svg",
  };

  return (
    <Image
      src={iconMap[trend]}
      alt={`${trend} trend`}
      width={16}
      height={16}
      className="object-contain"
    />
  );
}

export function PatientManagement() {
  const supabase = useMemo(() => createClient(), []);

  // --- State Management ---
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [savedPatients, setSavedPatients] = useState<any[]>([]);
  const [manualPatients, setManualPatients] = useState<PatientRow[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedManual, setSelectedManual] = useState<PatientRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingManualId, setDeletingManualId] = useState<string | null>(null);
  const [addManualOpen, setAddManualOpen] = useState(false);
  
  // ✨ NEW: Track the currently logged-in doctor
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // ✨ NEW: Fetch the authenticated user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setDoctorId(session.user.id);
      } else {
        // Fallback for development if auth isn't fully integrated yet
        console.warn("No authenticated user found. Ensure doctors are logged in.");
        // Uncomment the line below to test UI without logging in:
        // setDoctorId("dev-test-doctor-id"); 
      }
    };
    fetchUser();
  }, [supabase]);

  const fetchPatients = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!doctorId) return; // Don't fetch until we know who is asking

      if (!opts?.silent) setIsFetching(true);
      const [rxRes, manualRes] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("*")
          .eq("doctor_id", doctorId)
          .order("created_at", { ascending: false }),
        supabase
          .from("patients")
          .select("*")
          .eq("doctor_id", doctorId)
          .order("created_at", { ascending: false }),
      ]);

      if (!rxRes.error && rxRes.data) setSavedPatients(rxRes.data);
      if (!manualRes.error && manualRes.data)
        setManualPatients(manualRes.data as PatientRow[]);
      if (!opts?.silent) setIsFetching(false);
    },
    [supabase, doctorId]
  );

  // Trigger fetch when doctorId is set
  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, fetchPatients]);

  useEffect(() => {
    if (!doctorId) return;

    const rxChannel = supabase
      .channel("prescriptions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prescriptions", filter: `doctor_id=eq.${doctorId}` },
        () => {
          fetchPatients({ silent: true });
        }
      )
      .subscribe();

    const patientsChannel = supabase
      .channel("patients-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients", filter: `doctor_id=eq.${doctorId}` },
        () => {
          fetchPatients({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rxChannel);
      supabase.removeChannel(patientsChannel);
    };
  }, [supabase, fetchPatients, doctorId]);

  /** Distinct patient population, by lowercased name across both sources. */
  const totalPatientsCount = useMemo(() => {
    const names = new Set<string>();
    for (const m of manualPatients) names.add(m.name.trim().toLowerCase());
    for (const p of savedPatients) {
      const n = (p.patient_name ?? "").trim().toLowerCase();
      if (n) names.add(n);
    }
    return names.size;
  }, [manualPatients, savedPatients]);

  const activePatientsCount = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const rxActive = savedPatients.filter(
      (p) => new Date(p.created_at).getTime() >= cutoff
    ).length;
    const manualActive = manualPatients.filter(
      (p) => new Date(p.created_at).getTime() >= cutoff
    ).length;
    return rxActive + manualActive;
  }, [savedPatients, manualPatients]);

  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    const thisMonth = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    };
    return (
      savedPatients.filter((p) => thisMonth(p.created_at)).length +
      manualPatients.filter((p) => thisMonth(p.created_at)).length
    );
  }, [savedPatients, manualPatients]);

  const getStatDisplayValue = (label: string, fallback: number) => {
    if (label === "Total Patients") return totalPatientsCount;
    if (label === "Active Patients") return activePatientsCount;
    if (label === "New This Month") return newThisMonthCount;
    return fallback;
  };

  const handleDeletePatient = async (e: React.MouseEvent, patient: { id: string; patient_name?: string }) => {
    e.stopPropagation();
    const name = patient.patient_name || "this record";
    if (!confirm(`Delete patient record for ${name}? This cannot be undone.`)) return;

    setDeletingId(patient.id);
    const { error: deleteError } = await supabase.from("prescriptions").delete().eq("id", patient.id);
    setDeletingId(null);

    if (deleteError) {
      alert(deleteError.message || "Could not delete the record.");
      return;
    }

    if (selectedPatient?.id === patient.id) setSelectedPatient(null);
    fetchPatients({ silent: true });
  };

  const handleScan = async () => {
    if (!file) {
      setError("Please select a prescription image first.");
      return;
    }

    // ✨ NEW: Ensure we have a doctor ID before scanning
    if (!doctorId) {
      setError("Authentication error: Could not identify the logged-in doctor.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setScannedData(null);

    try {
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("ngrok_url")
        .eq("id", 1)
        .single();

      if (configError || !configData?.ngrok_url || configData.ngrok_url === 'waiting_for_colab') {
        throw new Error("The AI processing server is currently offline. Please start the Colab notebook.");
      }

      let apiUrl = configData.ngrok_url;
      let base = apiUrl.trim().replace(/\/+$/, "");
      let cleanUrl = base + (base.endsWith("/scan") ? "/" : "/scan/");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("doctor_id", doctorId); // ✨ NEW: Send the doctor ID to FastAPI

      const response = await fetch(cleanUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("AI server failed to process the document.");

      const result = await response.json();
      setScannedData(result.data);
      
      fetchPatients(); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during scanning.");
    } finally {
      setIsLoading(false);
    }
  };

  /** Unified row for the dashboard table — prescriptions + manual patients. */
  type RxRow = {
    kind: "rx";
    id: string;
    name: string;
    createdAt: string;
    prescriptionDate: string | null;
    medications: any[];
    raw: any;
  };
  type ManualRow = {
    kind: "manual";
    id: string;
    name: string;
    createdAt: string;
    phone: string | null;
    raw: PatientRow;
  };
  type DashboardRow = RxRow | ManualRow;

  const mergedRows: DashboardRow[] = useMemo(() => {
    const rx: RxRow[] = savedPatients.map((p) => ({
      kind: "rx",
      id: p.id,
      name: p.patient_name || "Unknown",
      createdAt: p.created_at,
      prescriptionDate: p.prescription_date ?? null,
      medications: Array.isArray(p.medications) ? p.medications : [],
      raw: p,
    }));
    const manual: ManualRow[] = manualPatients.map((m) => ({
      kind: "manual",
      id: m.id,
      name: m.name,
      createdAt: m.created_at,
      phone: m.phone,
      raw: m,
    }));
    return [...rx, ...manual].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [savedPatients, manualPatients]);

  const filteredPatients = mergedRows.filter((row) =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteManualPatient = async (
    e: React.MouseEvent,
    row: ManualRow
  ) => {
    e.stopPropagation();
    if (!confirm(`Delete patient "${row.name}"? This cannot be undone.`)) return;
    setDeletingManualId(row.id);
    const { error: delErr } = await supabase
      .from("patients")
      .delete()
      .eq("id", row.id);
    setDeletingManualId(null);
    if (delErr) {
      alert(delErr.message || "Could not delete the patient.");
      return;
    }
    fetchPatients({ silent: true });
  };

  return (
    <section id="prescription-ocr" className="mb-6 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-[#212121] dark:text-neutral-100 mb-2">
            {patientManagementContent.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">

          <PatientFormDialog
            open={addManualOpen}
            onOpenChange={setAddManualOpen}
            onSaved={() => fetchPatients({ silent: true })}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm border border-[#EDEDED] dark:border-white/10 text-[#212121] dark:text-neutral-200 bg-white dark:bg-[hsl(var(--surface-elevated))] hover:bg-gray-50 dark:hover:bg-white/10 rounded-[10px] flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="font-normal">Add manually</span>
              </Button>
            }
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3 text-sm border border-[#EDEDED] dark:border-white/10 text-[#212121] dark:text-neutral-200 bg-white dark:bg-[hsl(var(--surface-elevated))] hover:bg-gray-50 dark:hover:bg-white/10 rounded-[10px] flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4"/>
                <span className="font-normal">Scan prescription</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[hsl(var(--surface-card))] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/40 mb-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    🤖 AI Prescription Scanner
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
                    Upload a handwritten or printed prescription to automatically extract patient details and medications using NeuroMedica's Vision AI.
                  </p>
                  
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="file" className="text-xs font-medium">Prescription Image</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="h-8 text-xs cursor-pointer bg-white dark:bg-[hsl(var(--surface-elevated))] dark:text-neutral-100 dark:border-white/10"
                      />
                    </div>

                    <Button
                      onClick={handleScan}
                      disabled={isLoading || !doctorId}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-9"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                          Processing Document...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4"/>
                          Scan Prescription
                        </>
                      )}
                    </Button>

                    {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
                  </div>
                </div>

                {scannedData && (
                  <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 dark:bg-emerald-900/30 rounded-md border border-green-200 dark:border-emerald-800/40">
                      <div>
                        <Label className="text-[10px] uppercase text-green-700 dark:text-emerald-300">Patient Name</Label>
                        <p className="font-medium text-sm text-green-900 dark:text-emerald-100">{scannedData.patient_name || "Not found"}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-green-700 dark:text-emerald-300">Date</Label>
                        <p className="font-medium text-sm text-green-900 dark:text-emerald-100">{scannedData.date || "Not found"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block dark:text-neutral-100">Extracted Medications</Label>
                      <div className="border dark:border-white/10 rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-300 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-2">Medicine</th>
                              <th className="px-4 py-2">Dosage</th>
                              <th className="px-4 py-2">Freq</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-white/10">
                            {scannedData.medications && Array.isArray(scannedData.medications) ? (
                              scannedData.medications.map((med: any, idx: number) => (
                                <tr key={idx} className="bg-white dark:bg-[hsl(var(--surface-card))]">
                                  <td className="px-4 py-2 font-medium dark:text-neutral-100">{med.medicine_name || "-"}</td>
                                  <td className="px-4 py-2 dark:text-neutral-300">{med.dosage || "-"}</td>
                                  <td className="px-4 py-2 dark:text-neutral-300">{med.frequency || "-"}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-gray-500 dark:text-neutral-400">No medications found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {patientManagementContent.stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div
              className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] dark:border-white/10 bg-[#FCFCFC] dark:bg-[hsl(var(--surface-card))] shadow-sm dark:shadow-none"
            >
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: "url(/assets/icons/Pattern.png)",
                  backgroundRepeat: "repeat",
                  backgroundSize: "auto",
                }}
              ></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[15px] font-medium text-[#212121] dark:text-neutral-100">
                    {stat.label}
                  </span>
                  <Image src={stat.icon} alt={stat.label} width={24} height={24} className="object-contain"/>
                </div>
                <div className="space-y-1">
                  <div className="text-[40px] font-bold leading-none text-[#212121] dark:text-neutral-100">
                    {getStatDisplayValue(stat.label, stat.value)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendIcon trend={stat.trend as "up" | "down" | "neutral"} />
                    <span className="text-[#212121] dark:text-neutral-300">{stat.comparison}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[hsl(var(--surface-card))] rounded-xl border border-[#EDEDED] dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none"
      >
        <div className="px-5 py-4 border-b border-[#EDEDED] dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#212121] dark:text-neutral-100">Recent Patient Records</h3>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-neutral-500"/>}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-neutral-500"/>
            <Input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-white dark:bg-[hsl(var(--surface-elevated))] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:border-white/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white dark:bg-[hsl(var(--surface-card))] text-gray-500 dark:text-neutral-400 text-xs border-b border-[#EDEDED] dark:border-white/10">
              <tr>
                <th className="px-5 py-3 font-medium">Patient Name</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] dark:divide-white/10">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((row) => {
                  return (
                    <tr
                      key={`${row.kind}:${row.id}`}
                      onClick={() =>
                        row.kind === "rx"
                          ? setSelectedPatient(row.raw)
                          : setSelectedManual(row.raw)
                      }
                      className="transition-colors group hover:bg-blue-50/50 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-neutral-100">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                              row.kind === "rx"
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60"
                                : "bg-neuro-primary/10 text-neuro-primary group-hover:bg-neuro-primary/20"
                            }`}
                          >
                            {row.name.charAt(0).toUpperCase() || "?"}
                          </div>
                          {row.name}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                            row.kind === "manual"
                              ? "bg-neuro-primary/10 text-neuro-primary"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {row.kind === "manual" ? "Manual" : "Prescription"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-neutral-400">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        {row.kind === "rx" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-neutral-200">
                            <FileText className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-400" />
                            {row.medications.length} prescribed
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-neutral-400">
                            {row.phone || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.kind === "rx" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            disabled={deletingId === row.id}
                            aria-label="Delete patient record"
                            onClick={(e) => handleDeletePatient(e, row.raw)}
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            disabled={deletingManualId === row.id}
                            aria-label="Delete manual patient"
                            onClick={(e) => handleDeleteManualPatient(e, row)}
                          >
                            {deletingManualId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500 dark:text-neutral-400"
                  >
                    {searchQuery
                      ? "No patients match your search."
                      : "No patient records yet. Add a patient manually or scan a prescription to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      
      <Dialog
        open={!!selectedPatient}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
      >
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[hsl(var(--surface-card))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-neutral-100">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
              Patient Record
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Full Name</Label>
                  <p className="font-semibold text-base text-gray-900 dark:text-neutral-100">{selectedPatient.patient_name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Prescription Date</Label>
                  <p className="font-semibold text-base text-gray-900 dark:text-neutral-100">{selectedPatient.prescription_date || "Unknown"}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-white/10 mt-1">
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Record Digitized On</Label>
                  <p className="font-medium text-sm text-gray-600 dark:text-neutral-300">{new Date(selectedPatient.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-neutral-200">
                  <FileText className="h-4 w-4 text-gray-500 dark:text-neutral-400"/>
                  Prescribed Medications
                </Label>
                <div className="border dark:border-white/10 rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-300 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Medicine</th>
                        <th className="px-4 py-3 font-medium">Dosage</th>
                        <th className="px-4 py-3 font-medium">Freq</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-white/10">
                      {selectedPatient.medications && Array.isArray(selectedPatient.medications) && selectedPatient.medications.length > 0 ? (
                        selectedPatient.medications.map((med: any, idx: number) => (
                          <tr key={idx} className="bg-white dark:bg-[hsl(var(--surface-card))] hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-300">{med.medicine_name || "-"}</td>
                            <td className="px-4 py-3 dark:text-neutral-300">{med.dosage || "-"}</td>
                            <td className="px-4 py-3 dark:text-neutral-300">{med.frequency || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-white/5">
                            No medications listed in this record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual patient detail dialog */}
      <Dialog
        open={!!selectedManual}
        onOpenChange={(open) => !open && setSelectedManual(null)}
      >
        <DialogContent className="sm:max-w-[560px] bg-white dark:bg-[hsl(var(--surface-card))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-neutral-100">
              <User className="h-5 w-5 text-neuro-primary" />
              Patient Details
            </DialogTitle>
          </DialogHeader>

          {selectedManual && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Full Name</Label>
                  <p className="font-semibold text-base text-gray-900 dark:text-neutral-100">{selectedManual.name}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Phone</Label>
                  <p className="font-medium text-sm text-gray-900 dark:text-neutral-100">{selectedManual.phone || "—"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Date of Birth</Label>
                  <p className="font-medium text-sm text-gray-900 dark:text-neutral-100">{selectedManual.date_of_birth || "—"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Sex</Label>
                  <p className="font-medium text-sm text-gray-900 dark:text-neutral-100 capitalize">
                    {selectedManual.sex && selectedManual.sex !== "unknown" ? selectedManual.sex : "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase text-gray-500 dark:text-neutral-400">Address</Label>
                  <p className="font-medium text-sm text-gray-900 dark:text-neutral-100">{selectedManual.address || "—"}</p>
                </div>
              </div>

              {selectedManual.notes && (
                <div>
                  <Label className="text-sm font-semibold mb-2 flex items-center gap-2 dark:text-neutral-200">
                    <FileText className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                    Notes
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-neutral-300 whitespace-pre-wrap">
                    {selectedManual.notes}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                Added {new Date(selectedManual.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}