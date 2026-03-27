import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClinicalComingSoon } from "@/components/doctors/clinical-coming-soon";
import { Activity } from "lucide-react";

async function EcgContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <ClinicalComingSoon
      title="ECG Signal Analysis"
      description="Rhythm detection and interval analysis"
      Icon={Activity}
    />
  );
}

export default function EcgSignalAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <EcgContent />
    </Suspense>
  );
}
