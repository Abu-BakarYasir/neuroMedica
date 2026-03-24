// "use client";

// import Image from "next/image";
// import { motion } from "framer-motion";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { patientManagementContent } from "@/lib/doctor-content";
// import { Plus, Users } from "lucide-react";

// function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
//   const iconMap = {
//     up: "/assets/icons/green.svg",
//     down: "/assets/icons/red.svg",
//     neutral: "/assets/icons/trend-neutral-blue.svg",
//   };

//   return (
//     <Image
//       src={iconMap[trend]}
//       alt={`${trend} trend`}
//       width={16}
//       height={16}
//       className="object-contain"
//     />
//   );
// }

// export function PatientManagement() {
//   return (
//     <section className="mb-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-[18px] font-medium text-[#212121] mb-2">
//             {patientManagementContent.title}
//           </h2>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
//             style={{
//               boxShadow:
//                 "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)",
//             }}
//           >
//             <Plus className="h-4 w-4" />
//             <span className="font-normal">Add Patient</span>
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {patientManagementContent.stats.map((stat, index) => (
//           <motion.div
//             key={stat.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: index * 0.1 }}
//           >
//             <div
//               className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]"
//               style={{
//                 boxShadow:
//                   "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)",
//               }}
//             >
//               {/* Pattern Overlay */}
//               <div
//                 className="absolute inset-0 opacity-30 pointer-events-none"
//                 style={{
//                   backgroundImage: "url(/assets/icons/Pattern.png)",
//                   backgroundRepeat: "repeat",
//                   backgroundSize: "auto",
//                 }}
//               ></div>

//               <div className="relative z-10">
//                 <div className="flex items-start justify-between mb-4">
//                   <span className="text-[15px] font-medium text-[#212121]">
//                     {stat.label}
//                   </span>
//                   <Image
//                     src={stat.icon}
//                     alt={stat.label}
//                     width={24}
//                     height={24}
//                     className="object-contain"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <div className="text-[40px] font-bold leading-none text-[#212121]">
//                     {stat.value}
//                   </div>
//                   <div className="flex items-center gap-1 text-xs">
//                     <TrendIcon trend={stat.trend} />
//                     <span className="text-[#212121]">{stat.comparison}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </section>
//   );
// }



// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { motion } from "framer-motion";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { patientManagementContent } from "@/lib/doctor-content";
// import { Plus, UploadCloud, Loader2 } from "lucide-react";

// // Shadcn UI Imports (Make sure these exist in your components/ui folder)
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
//   const iconMap = {
//     up: "/assets/icons/green.svg",
//     down: "/assets/icons/red.svg",
//     neutral: "/assets/icons/trend-neutral-blue.svg",
//   };

//   return (
//     <Image
//       src={iconMap[trend]}
//       alt={`${trend} trend`}
//       width={16}
//       height={16}
//       className="object-contain"
//     />
//   );
// }

// export function PatientManagement() {
//   // --- OCR Module State ---
//   const [apiUrl, setApiUrl] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [scannedData, setScannedData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleScan = async () => {
//     if (!apiUrl || !file) {
//       setError("Please provide both the Ngrok URL and an image.");
//       return;
//     }

//     setError(null);
//     setIsLoading(true);
//     setScannedData(null);

//     // Bulletproof URL formatting
//     let base = apiUrl.trim().replace(/\/+$/, "");
//     if (base.endsWith("/scan")) {
//       base = base.slice(0, -5);
//     }
//     let cleanUrl = base + "/scan/";

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await fetch(cleanUrl, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) throw new Error("Server failed to respond properly.");

//       const result = await response.json();
//       setScannedData(result.data);
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || "An error occurred during scanning.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <section className="mb-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-[18px] font-medium text-[#212121] mb-2">
//             {patientManagementContent.title}
//           </h2>
//         </div>
//         <div className="flex items-center gap-2">
          
//           {/* --- ADD PATIENT DIALOG INTEGRATION --- */}
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
//                 style={{
//                   boxShadow:
//                     "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)",
//                 }}
//               >
//                 <Plus className="h-4 w-4" />
//                 <span className="font-normal">Add Patient</span>
//               </Button>
//             </DialogTrigger>
            
//             <DialogContent className="sm:max-w-[600px] bg-white">
//               <DialogHeader>
//                 <DialogTitle>Add New Patient</DialogTitle>
//               </DialogHeader>

//               <div className="grid gap-4 py-4">
//                 <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
//                   <h4 className="text-sm font-semibold text-blue-900 mb-1">
//                     🤖 AI Prescription Scanner
//                   </h4>
//                   <p className="text-xs text-blue-700 mb-4">
//                     Upload a handwritten or printed prescription to automatically extract patient details and medications using NeuroMedica's Vision AI.
//                   </p>
                  
//                   <div className="grid gap-3">
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="apiUrl" className="text-xs font-medium">Ngrok API URL</Label>
//                       <Input
//                         id="apiUrl"
//                         placeholder="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
//                         value={apiUrl}
//                         onChange={(e) => setApiUrl(e.target.value)}
//                         className="h-8 text-xs"
//                       />
//                     </div>
                    
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="file" className="text-xs font-medium">Prescription Image</Label>
//                       <Input
//                         id="file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="h-8 text-xs cursor-pointer"
//                       />
//                     </div>

//                     <Button 
//                       onClick={handleScan} 
//                       disabled={isLoading}
//                       className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-9"
//                     >
//                       {isLoading ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Processing Document...
//                         </>
//                       ) : (
//                         <>
//                           <UploadCloud className="mr-2 h-4 w-4" />
//                           Scan Prescription
//                         </>
//                       )}
//                     </Button>

//                     {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//                   </div>
//                 </div>

//                 {/* --- DISPLAY EXTRACTED DATA --- */}
//                 {scannedData && (
//                   <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
//                     <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
//                       <div>
//                         <Label className="text-[10px] uppercase text-gray-500">Patient Name</Label>
//                         <p className="font-medium text-sm">{scannedData.patient_name || "Not found"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-[10px] uppercase text-gray-500">Date</Label>
//                         <p className="font-medium text-sm">{scannedData.date || "Not found"}</p>
//                       </div>
//                     </div>

//                     <div>
//                       <Label className="text-sm font-semibold mb-2 block">Extracted Medications</Label>
//                       <div className="border rounded-md overflow-hidden">
//                         <table className="w-full text-sm text-left">
//                           <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
//                             <tr>
//                               <th className="px-4 py-2">Medicine</th>
//                               <th className="px-4 py-2">Dosage</th>
//                               <th className="px-4 py-2">Freq</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y">
//                             {scannedData.medications && Array.isArray(scannedData.medications) ? (
//                               scannedData.medications.map((med: any, idx: number) => (
//                                 <tr key={idx} className="bg-white">
//                                   <td className="px-4 py-2 font-medium">{med.medicine_name || "-"}</td>
//                                   <td className="px-4 py-2">{med.dosage || "-"}</td>
//                                   <td className="px-4 py-2">{med.frequency || "-"}</td>
//                                 </tr>
//                               ))
//                             ) : (
//                               <tr>
//                                 <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No medications found.</td>
//                               </tr>
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* --- STATS CARDS BELOW --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {patientManagementContent.stats.map((stat, index) => (
//           <motion.div
//             key={stat.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: index * 0.1 }}
//           >
//             <div
//               className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]"
//               style={{
//                 boxShadow:
//                   "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)",
//               }}
//             >
//               <div
//                 className="absolute inset-0 opacity-30 pointer-events-none"
//                 style={{
//                   backgroundImage: "url(/assets/icons/Pattern.png)",
//                   backgroundRepeat: "repeat",
//                   backgroundSize: "auto",
//                 }}
//               ></div>

//               <div className="relative z-10">
//                 <div className="flex items-start justify-between mb-4">
//                   <span className="text-[15px] font-medium text-[#212121]">
//                     {stat.label}
//                   </span>
//                   <Image
//                     src={stat.icon}
//                     alt={stat.label}
//                     width={24}
//                     height={24}
//                     className="object-contain"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <div className="text-[40px] font-bold leading-none text-[#212121]">
//                     {stat.value}
//                   </div>
//                   <div className="flex items-center gap-1 text-xs">
//                     <TrendIcon trend={stat.trend} />
//                     <span className="text-[#212121]">{stat.comparison}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </section>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { motion } from "framer-motion";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { patientManagementContent } from "@/lib/doctor-content";
// import { Plus, UploadCloud, Loader2, FileText } from "lucide-react";

// // Supabase Client for Next.js App Router
// import { createBrowserClient } from '@supabase/ssr';

// // Shadcn UI Imports
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
//   const iconMap = {
//     up: "/assets/icons/green.svg",
//     down: "/assets/icons/red.svg",
//     neutral: "/assets/icons/trend-neutral-blue.svg",
//   };

//   return (
//     <Image
//       src={iconMap[trend]}
//       alt={`${trend} trend`}
//       width={16}
//       height={16}
//       className="object-contain"
//     />
//   );
// }

// export function PatientManagement() {
//   // --- Initialize Supabase ---
//   const supabase = createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
//   );

//   // --- State Management ---
//   const [apiUrl, setApiUrl] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [scannedData, setScannedData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
  
//   // New state to hold the fetched database rows
//   const [savedPatients, setSavedPatients] = useState<any[]>([]);
//   const [isFetching, setIsFetching] = useState(true);

//   // --- Fetch Patients from Supabase ---
//   const fetchPatients = async () => {
//     setIsFetching(true);
//     const { data, error } = await supabase
//       .from("prescriptions")
//       .select("*")
//       .order("created_at", { ascending: false }); // Show newest first

//     if (error) {
//       console.error("Error fetching patients:", error);
//     } else if (data) {
//       setSavedPatients(data);
//     }
//     setIsFetching(false);
//   };

//   // Run the fetch function when the page first loads
//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   // --- OCR Scan Logic ---
//   const handleScan = async () => {
//     if (!apiUrl || !file) {
//       setError("Please provide both the Ngrok URL and an image.");
//       return;
//     }

//     setError(null);
//     setIsLoading(true);
//     setScannedData(null);

//     let base = apiUrl.trim().replace(/\/+$/, "");
//     if (base.endsWith("/scan")) {
//       base = base.slice(0, -5);
//     }
//     let cleanUrl = base + "/scan/";

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await fetch(cleanUrl, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) throw new Error("Server failed to respond properly.");

//       const result = await response.json();
//       setScannedData(result.data);
      
//       // ✨ BOOM: Refresh the table instantly after a successful save!
//       fetchPatients(); 

//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || "An error occurred during scanning.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <section className="mb-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-[18px] font-medium text-[#212121] mb-2">
//             {patientManagementContent.title}
//           </h2>
//         </div>
//         <div className="flex items-center gap-2">
          
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
//                 style={{
//                   boxShadow:
//                     "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)",
//                 }}
//               >
//                 <Plus className="h-4 w-4" />
//                 <span className="font-normal">Add Patient</span>
//               </Button>
//             </DialogTrigger>
            
//             <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Add New Patient</DialogTitle>
//               </DialogHeader>

//               <div className="grid gap-4 py-4">
//                 <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
//                   <h4 className="text-sm font-semibold text-blue-900 mb-1">
//                     🤖 AI Prescription Scanner
//                   </h4>
//                   <p className="text-xs text-blue-700 mb-4">
//                     Upload a handwritten or printed prescription to automatically extract patient details and medications using NeuroMedica's Vision AI.
//                   </p>
                  
//                   <div className="grid gap-3">
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="apiUrl" className="text-xs font-medium">Ngrok API URL</Label>
//                       <Input
//                         id="apiUrl"
//                         placeholder="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
//                         value={apiUrl}
//                         onChange={(e) => setApiUrl(e.target.value)}
//                         className="h-8 text-xs bg-white"
//                       />
//                     </div>
                    
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="file" className="text-xs font-medium">Prescription Image</Label>
//                       <Input
//                         id="file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="h-8 text-xs cursor-pointer bg-white"
//                       />
//                     </div>

//                     <Button 
//                       onClick={handleScan} 
//                       disabled={isLoading}
//                       className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-9"
//                     >
//                       {isLoading ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Processing Document...
//                         </>
//                       ) : (
//                         <>
//                           <UploadCloud className="mr-2 h-4 w-4" />
//                           Scan Prescription
//                         </>
//                       )}
//                     </Button>

//                     {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//                   </div>
//                 </div>

//                 {scannedData && (
//                   <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
//                     <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
//                       <div>
//                         <Label className="text-[10px] uppercase text-gray-500">Patient Name</Label>
//                         <p className="font-medium text-sm">{scannedData.patient_name || "Not found"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-[10px] uppercase text-gray-500">Date</Label>
//                         <p className="font-medium text-sm">{scannedData.date || "Not found"}</p>
//                       </div>
//                     </div>

//                     <div>
//                       <Label className="text-sm font-semibold mb-2 block">Extracted Medications</Label>
//                       <div className="border rounded-md overflow-hidden">
//                         <table className="w-full text-sm text-left">
//                           <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
//                             <tr>
//                               <th className="px-4 py-2">Medicine</th>
//                               <th className="px-4 py-2">Dosage</th>
//                               <th className="px-4 py-2">Freq</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y">
//                             {scannedData.medications && Array.isArray(scannedData.medications) ? (
//                               scannedData.medications.map((med: any, idx: number) => (
//                                 <tr key={idx} className="bg-white">
//                                   <td className="px-4 py-2 font-medium">{med.medicine_name || "-"}</td>
//                                   <td className="px-4 py-2">{med.dosage || "-"}</td>
//                                   <td className="px-4 py-2">{med.frequency || "-"}</td>
//                                 </tr>
//                               ))
//                             ) : (
//                               <tr>
//                                 <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No medications found.</td>
//                               </tr>
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* --- STATS CARDS --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//         {patientManagementContent.stats.map((stat, index) => (
//           <motion.div
//             key={stat.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: index * 0.1 }}
//           >
//             <div
//               className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]"
//               style={{
//                 boxShadow:
//                   "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)",
//               }}
//             >
//               <div
//                 className="absolute inset-0 opacity-30 pointer-events-none"
//                 style={{
//                   backgroundImage: "url(/assets/icons/Pattern.png)",
//                   backgroundRepeat: "repeat",
//                   backgroundSize: "auto",
//                 }}
//               ></div>

//               <div className="relative z-10">
//                 <div className="flex items-start justify-between mb-4">
//                   <span className="text-[15px] font-medium text-[#212121]">
//                     {stat.label}
//                   </span>
//                   <Image
//                     src={stat.icon}
//                     alt={stat.label}
//                     width={24}
//                     height={24}
//                     className="object-contain"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <div className="text-[40px] font-bold leading-none text-[#212121]">
//                     {/* If it's the Total Patients card, we can make it dynamic! */}
//                     {stat.label === "Total Patients" ? savedPatients.length : stat.value}
//                   </div>
//                   <div className="flex items-center gap-1 text-xs">
//                     <TrendIcon trend={stat.trend} />
//                     <span className="text-[#212121]">{stat.comparison}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* --- RECENT PATIENTS TABLE --- */}
//       <motion.div 
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.3 }}
//         className="bg-white rounded-xl border border-[#EDEDED] overflow-hidden shadow-sm"
//       >
//         <div className="px-5 py-4 border-b border-[#EDEDED] flex justify-between items-center bg-gray-50/50">
//           <h3 className="font-semibold text-[#212121]">Recent Patient Records</h3>
//           {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
//         </div>
        
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-white text-gray-500 text-xs border-b border-[#EDEDED]">
//               <tr>
//                 <th className="px-5 py-3 font-medium">Patient Name</th>
//                 <th className="px-5 py-3 font-medium">Date Scanned</th>
//                 <th className="px-5 py-3 font-medium">Prescription Date</th>
//                 <th className="px-5 py-3 font-medium">Medications Count</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-[#EDEDED]">
//               {savedPatients.length > 0 ? (
//                 savedPatients.map((patient) => (
//                   <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
//                     <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
//                       <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
//                         {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : "?"}
//                       </div>
//                       {patient.patient_name || "Unknown"}
//                     </td>
//                     <td className="px-5 py-3 text-gray-500">
//                       {new Date(patient.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="px-5 py-3 text-gray-500">
//                       {patient.prescription_date || "N/A"}
//                     </td>
//                     <td className="px-5 py-3">
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//                         <FileText className="h-3 w-3 mr-1" />
//                         {patient.medications ? patient.medications.length : 0} prescribed
//                       </span>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
//                     No patient records found. Scan a prescription to get started.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>
//     </section>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { motion } from "framer-motion";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { patientManagementContent } from "@/lib/doctor-content";
// import { Plus, UploadCloud, Loader2, FileText, Search, User } from "lucide-react";

// // Supabase Client for Next.js App Router
// import { createBrowserClient } from '@supabase/ssr';

// // Shadcn UI Imports
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
//   const iconMap = {
//     up: "/assets/icons/green.svg",
//     down: "/assets/icons/red.svg",
//     neutral: "/assets/icons/trend-neutral-blue.svg",
//   };

//   return (
//     <Image
//       src={iconMap[trend]}
//       alt={`${trend} trend`}
//       width={16}
//       height={16}
//       className="object-contain"
//     />
//   );
// }

// export function PatientManagement() {
//   // --- Initialize Supabase ---
//   const supabase = createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
//   );

//   // --- State Management ---
//   const [apiUrl, setApiUrl] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [scannedData, setScannedData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
  
//   const [savedPatients, setSavedPatients] = useState<any[]>([]);
//   const [isFetching, setIsFetching] = useState(true);

//   // --- NEW: Search & Details State ---
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

//   // --- Fetch Patients from Supabase ---
//   const fetchPatients = async () => {
//     setIsFetching(true);
//     const { data, error } = await supabase
//       .from("prescriptions")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching patients:", error);
//     } else if (data) {
//       setSavedPatients(data);
//     }
//     setIsFetching(false);
//   };

//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   // --- OCR Scan Logic ---
//   const handleScan = async () => {
//     if (!apiUrl || !file) {
//       setError("Please provide both the Ngrok URL and an image.");
//       return;
//     }

//     setError(null);
//     setIsLoading(true);
//     setScannedData(null);

//     let base = apiUrl.trim().replace(/\/+$/, "");
//     if (base.endsWith("/scan")) {
//       base = base.slice(0, -5);
//     }
//     let cleanUrl = base + "/scan/";

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await fetch(cleanUrl, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) throw new Error("Server failed to respond properly.");

//       const result = await response.json();
//       setScannedData(result.data);
      
//       // Refresh the table instantly after a successful save
//       fetchPatients(); 

//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || "An error occurred during scanning.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- NEW: Filter Patients based on Search ---
//   const filteredPatients = savedPatients.filter((patient) => {
//     const name = patient.patient_name || "";
//     return name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   return (
//     <section className="mb-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-[18px] font-medium text-[#212121] mb-2">
//             {patientManagementContent.title}
//           </h2>
//         </div>
//         <div className="flex items-center gap-2">
          
//           {/* ADD PATIENT DIALOG */}
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
//                 style={{
//                   boxShadow:
//                     "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)",
//                 }}
//               >
//                 <Plus className="h-4 w-4" />
//                 <span className="font-normal">Add Patient</span>
//               </Button>
//             </DialogTrigger>
            
//             <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Add New Patient</DialogTitle>
//               </DialogHeader>

//               <div className="grid gap-4 py-4">
//                 <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
//                   <h4 className="text-sm font-semibold text-blue-900 mb-1">
//                     🤖 AI Prescription Scanner
//                   </h4>
//                   <p className="text-xs text-blue-700 mb-4">
//                     Upload a handwritten or printed prescription to automatically extract patient details and medications using NeuroMedica's Vision AI.
//                   </p>
                  
//                   <div className="grid gap-3">
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="apiUrl" className="text-xs font-medium">Ngrok API URL</Label>
//                       <Input
//                         id="apiUrl"
//                         placeholder="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
//                         value={apiUrl}
//                         onChange={(e) => setApiUrl(e.target.value)}
//                         className="h-8 text-xs bg-white"
//                       />
//                     </div>
                    
//                     <div className="grid gap-1.5">
//                       <Label htmlFor="file" className="text-xs font-medium">Prescription Image</Label>
//                       <Input
//                         id="file"
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="h-8 text-xs cursor-pointer bg-white"
//                       />
//                     </div>

//                     <Button 
//                       onClick={handleScan} 
//                       disabled={isLoading}
//                       className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-9"
//                     >
//                       {isLoading ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Processing Document...
//                         </>
//                       ) : (
//                         <>
//                           <UploadCloud className="mr-2 h-4 w-4" />
//                           Scan Prescription
//                         </>
//                       )}
//                     </Button>

//                     {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//                   </div>
//                 </div>

//                 {scannedData && (
//                   <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
//                     <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-md border border-green-200">
//                       <div>
//                         <Label className="text-[10px] uppercase text-green-700">Patient Name</Label>
//                         <p className="font-medium text-sm text-green-900">{scannedData.patient_name || "Not found"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-[10px] uppercase text-green-700">Date</Label>
//                         <p className="font-medium text-sm text-green-900">{scannedData.date || "Not found"}</p>
//                       </div>
//                     </div>

//                     <div>
//                       <Label className="text-sm font-semibold mb-2 block">Extracted Medications</Label>
//                       <div className="border rounded-md overflow-hidden">
//                         <table className="w-full text-sm text-left">
//                           <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
//                             <tr>
//                               <th className="px-4 py-2">Medicine</th>
//                               <th className="px-4 py-2">Dosage</th>
//                               <th className="px-4 py-2">Freq</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y">
//                             {scannedData.medications && Array.isArray(scannedData.medications) ? (
//                               scannedData.medications.map((med: any, idx: number) => (
//                                 <tr key={idx} className="bg-white">
//                                   <td className="px-4 py-2 font-medium">{med.medicine_name || "-"}</td>
//                                   <td className="px-4 py-2">{med.dosage || "-"}</td>
//                                   <td className="px-4 py-2">{med.frequency || "-"}</td>
//                                 </tr>
//                               ))
//                             ) : (
//                               <tr>
//                                 <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No medications found.</td>
//                               </tr>
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* --- STATS CARDS --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//         {patientManagementContent.stats.map((stat, index) => (
//           <motion.div
//             key={stat.id}
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: index * 0.1 }}
//           >
//             <div
//               className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]"
//               style={{
//                 boxShadow:
//                   "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)",
//               }}
//             >
//               <div
//                 className="absolute inset-0 opacity-30 pointer-events-none"
//                 style={{
//                   backgroundImage: "url(/assets/icons/Pattern.png)",
//                   backgroundRepeat: "repeat",
//                   backgroundSize: "auto",
//                 }}
//               ></div>

//               <div className="relative z-10">
//                 <div className="flex items-start justify-between mb-4">
//                   <span className="text-[15px] font-medium text-[#212121]">
//                     {stat.label}
//                   </span>
//                   <Image
//                     src={stat.icon}
//                     alt={stat.label}
//                     width={24}
//                     height={24}
//                     className="object-contain"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <div className="text-[40px] font-bold leading-none text-[#212121]">
//                     {stat.label === "Total Patients" ? savedPatients.length : stat.value}
//                   </div>
//                   <div className="flex items-center gap-1 text-xs">
//                     <TrendIcon trend={stat.trend} />
//                     <span className="text-[#212121]">{stat.comparison}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* --- RECENT PATIENTS TABLE WITH SEARCH --- */}
//       <motion.div 
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.3 }}
//         className="bg-white rounded-xl border border-[#EDEDED] overflow-hidden shadow-sm"
//       >
//         <div className="px-5 py-4 border-b border-[#EDEDED] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
//           <div className="flex items-center gap-2">
//             <h3 className="font-semibold text-[#212121]">Recent Patient Records</h3>
//             {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
//           </div>
          
//           {/* NEW: Search Bar */}
//           <div className="relative w-full sm:w-64">
//             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
//             <Input
//               type="text"
//               placeholder="Search by patient name..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-9 h-9 text-sm bg-white"
//             />
//           </div>
//         </div>
        
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-white text-gray-500 text-xs border-b border-[#EDEDED]">
//               <tr>
//                 <th className="px-5 py-3 font-medium">Patient Name</th>
//                 <th className="px-5 py-3 font-medium">Date Scanned</th>
//                 <th className="px-5 py-3 font-medium">Prescription Date</th>
//                 <th className="px-5 py-3 font-medium">Medications Count</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-[#EDEDED]">
//               {filteredPatients.length > 0 ? (
//                 filteredPatients.map((patient) => (
//                   <tr 
//                     key={patient.id} 
//                     onClick={() => setSelectedPatient(patient)}
//                     className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
//                   >
//                     <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
//                       <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs group-hover:bg-blue-200 transition-colors">
//                         {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : "?"}
//                       </div>
//                       {patient.patient_name || "Unknown"}
//                     </td>
//                     <td className="px-5 py-3 text-gray-500">
//                       {new Date(patient.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="px-5 py-3 text-gray-500">
//                       {patient.prescription_date || "N/A"}
//                     </td>
//                     <td className="px-5 py-3">
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 group-hover:bg-white transition-colors">
//                         <FileText className="h-3 w-3 mr-1 text-blue-500" />
//                         {patient.medications ? patient.medications.length : 0} prescribed
//                       </span>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
//                     {searchQuery ? "No patients match your search." : "No patient records found. Scan a prescription to get started."}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>

//       {/* --- NEW: VIEW PATIENT DETAILS DIALOG --- */}
//       <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
//         <DialogContent className="sm:max-w-[600px] bg-white">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <User className="h-5 w-5 text-blue-600" />
//               Patient Record
//             </DialogTitle>
//           </DialogHeader>

//           {selectedPatient && (
//             <div className="grid gap-4 py-2">
//               <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
//                 <div>
//                   <Label className="text-[10px] uppercase text-gray-500">Full Name</Label>
//                   <p className="font-semibold text-base text-gray-900">{selectedPatient.patient_name || "Unknown"}</p>
//                 </div>
//                 <div>
//                   <Label className="text-[10px] uppercase text-gray-500">Prescription Date</Label>
//                   <p className="font-semibold text-base text-gray-900">{selectedPatient.prescription_date || "Unknown"}</p>
//                 </div>
//                 <div className="col-span-2 pt-2 border-t border-gray-200 mt-1">
//                   <Label className="text-[10px] uppercase text-gray-500">Record Digitized On</Label>
//                   <p className="font-medium text-sm text-gray-600">{new Date(selectedPatient.created_at).toLocaleString()}</p>
//                 </div>
//               </div>

//               <div>
//                 <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
//                   <FileText className="h-4 w-4 text-gray-500" />
//                   Prescribed Medications
//                 </Label>
//                 <div className="border rounded-md overflow-hidden">
//                   <table className="w-full text-sm text-left">
//                     <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
//                       <tr>
//                         <th className="px-4 py-3 font-medium">Medicine</th>
//                         <th className="px-4 py-3 font-medium">Dosage</th>
//                         <th className="px-4 py-3 font-medium">Freq</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y">
//                       {selectedPatient.medications && Array.isArray(selectedPatient.medications) && selectedPatient.medications.length > 0 ? (
//                         selectedPatient.medications.map((med: any, idx: number) => (
//                           <tr key={idx} className="bg-white hover:bg-gray-50">
//                             <td className="px-4 py-3 font-medium text-blue-700">{med.medicine_name || "-"}</td>
//                             <td className="px-4 py-3">{med.dosage || "-"}</td>
//                             <td className="px-4 py-3">{med.frequency || "-"}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={3} className="px-4 py-6 text-center text-gray-500 bg-gray-50">
//                             No medications listed in this record.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </section>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { patientManagementContent } from "@/lib/doctor-content";
import { Plus, UploadCloud, Loader2, FileText, Search, User } from "lucide-react";

import { createBrowserClient } from '@supabase/ssr';

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
    <Image src={iconMap[trend]} alt={`${trend} trend`} width={16} height={16} className="object-contain" />
  );
}

export function PatientManagement() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // --- State Management ---
  const [file, setFile] = useState<File | null>(null); // URL state is gone!
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [savedPatients, setSavedPatients] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const fetchPatients = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setSavedPatients(data);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // --- NEW: Automated OCR Scan Logic ---
  const handleScan = async () => {
    if (!file) {
      setError("Please select a prescription image first.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setScannedData(null);

    try {
      // 1. Fetch the live Colab URL secretly from Supabase
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("ngrok_url")
        .eq("id", 1)
        .single();

      if (configError || !configData?.ngrok_url || configData.ngrok_url === 'waiting_for_colab') {
        throw new Error("The AI processing server is currently offline. Please start the Colab notebook.");
      }

      // 2. Format the URL securely
      let apiUrl = configData.ngrok_url;
      let base = apiUrl.trim().replace(/\/+$/, "");
      let cleanUrl = base + (base.endsWith("/scan") ? "/" : "/scan/");

      // 3. Send the image
      const formData = new FormData();
      formData.append("file", file);

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
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">
            {patientManagementContent.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
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
                    {/* THE URL INPUT IS GONE! Just the file upload remains. */}
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
                      disabled={isLoading}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-9"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Document...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4" />
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

      {/* --- STATS CARDS --- */}
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
                  <Image src={stat.icon} alt={stat.label} width={24} height={24} className="object-contain" />
                </div>
                <div className="space-y-1">
                  <div className="text-[40px] font-bold leading-none text-[#212121]">
                    {stat.label === "Total Patients" ? savedPatients.length : stat.value}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendIcon trend={stat.trend} />
                    <span className="text-[#212121]">{stat.comparison}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- RECENT PATIENTS TABLE WITH SEARCH --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-[#EDEDED] overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-[#EDEDED] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#212121]">Recent Patient Records</h3>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
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
                        <FileText className="h-3 w-3 mr-1 text-blue-500" />
                        {patient.medications ? patient.medications.length : 0} prescribed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    {searchQuery ? "No patients match your search." : "No patient records found. Scan a prescription to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* --- VIEW PATIENT DETAILS DIALOG --- */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
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
                  <FileText className="h-4 w-4 text-gray-500" />
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