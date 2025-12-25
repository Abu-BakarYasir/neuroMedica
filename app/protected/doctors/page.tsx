import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/doctors/search-bar";
import { PatientManagement } from "@/components/doctors/patient-management";
import { ClinicalTools } from "@/components/doctors/clinical-tools";
import { RecentActivity } from "@/components/doctors/recent-activity";
import { Notifications } from "@/components/doctors/notifications";
import { MedicalResources } from "@/components/doctors/medical-resources";
import { doctorWelcomeContent } from "@/lib/doctor-content";
import { Suspense } from "react";

async function DoctorWelcome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Extract name from email or user metadata
  const userName =
    data.user.user_metadata?.full_name ||
    data.user.user_metadata?.name ||
    data.user.email?.split("@")[0] ||
    "Doctor";

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-[#212121] mb-2" style={{ letterSpacing: "1%" }}>
        {doctorWelcomeContent.greeting} {userName}
      </h1>
      <p className="text-sm text-[#6B6C6E]" style={{ lineHeight: "1.15em" }}>
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
      <PatientManagement />

      {/* Clinical Tools Section */}
      <ClinicalTools />

      {/* Two Column Layout for Recent Activity and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <RecentActivity />
        </div>
        <div>
          <Notifications />
        </div>
      </div>

      {/* Medical Resources Section */}
      <MedicalResources />
    </div>
  );
}

