"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { patientManagementContent } from "@/lib/doctor-content";
import { Plus, UploadCloud, Loader2, FileText, Search, User, Trash2 } from "lucide-react";

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
  const [isFetching, setIsFetching] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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
      if (!doctorId) return; // ✨ NEW: Don't fetch until we know who is asking

      if (!opts?.silent) setIsFetching(true);
      const { data, error: fetchError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("doctor_id", doctorId) // ✨ NEW: Only fetch this doctor's patients
        .order("created_at", { ascending: false });

      if (!fetchError && data) setSavedPatients(data);
      if (!opts?.silent) setIsFetching(false);
    },
    [supabase, doctorId] // ✨ NEW: Added doctorId as a dependency
  );

  // Trigger fetch when doctorId is set
  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, fetchPatients]);

  useEffect(() => {
    if (!doctorId) return;

    const channel = supabase
      .channel("prescriptions-realtime")
      .on(
        "postgres_changes",
        // ✨ NEW: Filter realtime events to only this doctor's records
        { event: "*", schema: "public", table: "prescriptions", filter: `doctor_id=eq.${doctorId}` },
        () => {
          fetchPatients({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchPatients, doctorId]);

  const activePatientsCount = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return savedPatients.filter((p) => new Date(p.created_at).getTime() >= cutoff).length;
  }, [savedPatients]);

  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    return savedPatients.filter((p) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [savedPatients]);

  const getStatDisplayValue = (label: string, fallback: number) => {
    if (label === "Total Patients") return savedPatients.length;
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

  const filteredPatients = savedPatients.filter((patient) => {
    const name = patient.patient_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <section id="prescription-ocr" className="mb-6 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">
            {patientManagementContent.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4"/>
                <span className="font-normal">Add Patient</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    🤖 AI Prescription Scanner
                  </h4>
                  <p className="text-xs text-blue-700 mb-4">
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
                        className="h-8 text-xs cursor-pointer bg-white"
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

                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                  </div>
                </div>

                {scannedData && (
                  <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-md border border-green-200">
                      <div>
                        <Label className="text-[10px] uppercase text-green-700">Patient Name</Label>
                        <p className="font-medium text-sm text-green-900">{scannedData.patient_name || "Not found"}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-green-700">Date</Label>
                        <p className="font-medium text-sm text-green-900">{scannedData.date || "Not found"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Extracted Medications</Label>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-2">Medicine</th>
                              <th className="px-4 py-2">Dosage</th>
                              <th className="px-4 py-2">Freq</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {scannedData.medications && Array.isArray(scannedData.medications) ? (
                              scannedData.medications.map((med: any, idx: number) => (
                                <tr key={idx} className="bg-white">
                                  <td className="px-4 py-2 font-medium">{med.medicine_name || "-"}</td>
                                  <td className="px-4 py-2">{med.dosage || "-"}</td>
                                  <td className="px-4 py-2">{med.frequency || "-"}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No medications found.</td>
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
              className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC] shadow-sm"
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
                  <span className="text-[15px] font-medium text-[#212121]">
                    {stat.label}
                  </span>
                  <Image src={stat.icon} alt={stat.label} width={24} height={24} className="object-contain"/>
                </div>
                <div className="space-y-1">
                  <div className="text-[40px] font-bold leading-none text-[#212121]">
                    {getStatDisplayValue(stat.label, stat.value)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendIcon trend={stat.trend as "up" | "down" | "neutral"} />
                    <span className="text-[#212121]">{stat.comparison}</span>
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
        className="bg-white rounded-xl border border-[#EDEDED] overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-[#EDEDED] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#212121]">Recent Patient Records</h3>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400"/>}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"/>
            <Input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 text-xs border-b border-[#EDEDED]">
              <tr>
                <th className="px-5 py-3 font-medium">Patient Name</th>
                <th className="px-5 py-3 font-medium">Date Scanned</th>
                <th className="px-5 py-3 font-medium">Prescription Date</th>
                <th className="px-5 py-3 font-medium">Medications Count</th>
                <th className="px-5 py-3 font-medium w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    onClick={() => setSelectedPatient(patient)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs group-hover:bg-blue-200 transition-colors">
                        {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : "?"}
                      </div>
                      {patient.patient_name || "Unknown"}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {patient.prescription_date || "N/A"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 group-hover:bg-white transition-colors">
                        <FileText className="h-3 w-3 mr-1 text-blue-500"/>
                        {patient.medications ? patient.medications.length : 0} prescribed
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === patient.id}
                        aria-label="Delete patient record"
                        onClick={(e) => handleDeletePatient(e, patient)}
                      >
                        {deletingId === patient.id ? (
                          <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                          <Trash2 className="h-4 w-4"/>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    {searchQuery ? "No patients match your search." : "No patient records found. Scan a prescription to get started."}
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
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600"/>
              Patient Record
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label className="text-[10px] uppercase text-gray-500">Full Name</Label>
                  <p className="font-semibold text-base text-gray-900">{selectedPatient.patient_name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-gray-500">Prescription Date</Label>
                  <p className="font-semibold text-base text-gray-900">{selectedPatient.prescription_date || "Unknown"}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 mt-1">
                  <Label className="text-[10px] uppercase text-gray-500">Record Digitized On</Label>
                  <p className="font-medium text-sm text-gray-600">{new Date(selectedPatient.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500"/>
                  Prescribed Medications
                </Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Medicine</th>
                        <th className="px-4 py-3 font-medium">Dosage</th>
                        <th className="px-4 py-3 font-medium">Freq</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPatient.medications && Array.isArray(selectedPatient.medications) && selectedPatient.medications.length > 0 ? (
                        selectedPatient.medications.map((med: any, idx: number) => (
                          <tr key={idx} className="bg-white hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-blue-700">{med.medicine_name || "-"}</td>
                            <td className="px-4 py-3">{med.dosage || "-"}</td>
                            <td className="px-4 py-3">{med.frequency || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-500 bg-gray-50">
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
    </section>
  );
}