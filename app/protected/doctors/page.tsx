import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/doctors/search-bar";
import { PatientManagement } from "@/components/doctors/patient-management";
import { ClinicalTools } from "@/components/doctors/clinical-tools";
import { Notifications } from "@/components/doctors/notifications";
import { MedicalResources } from "@/components/doctors/medical-resources";
import { doctorWelcomeContent } from "@/lib/doctor-content";
import { buildDisplayName } from "@/lib/auth/user-display";
import { Suspense } from "react";

async function DoctorWelcome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Prefer the doctor's chosen name; fall back to email only as a last resort.
  const userName = buildDisplayName(data.user);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-[#212121] dark:text-neutral-100 mb-2" style={{ letterSpacing: "1%" }}>
        {doctorWelcomeContent.greeting} {userName}
      </h1>
      <p className="text-sm text-[#6B6C6E] dark:text-neutral-400" style={{ lineHeight: "1.15em" }}>
        {doctorWelcomeContent.subtitle}
      </p>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <Suspense fallback={<div className="h-16" />}>
          <DoctorWelcome />
        </Suspense>
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>

      {/* Patient Management Section */}
      <Suspense fallback={<div className="h-32" />}>
        <PatientManagement />
      </Suspense>

      {/* Clinical Tools Section */}
      <ClinicalTools />

      <div className="mb-6">
        <Notifications />
      </div>

      {/* Medical Resources Section */}
      <MedicalResources />
    </div>
  );
}

