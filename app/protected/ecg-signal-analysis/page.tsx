import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClinicalComingSoon } from "@/components/doctors/clinical-coming-soon";
import { Activity } from "lucide-react";

export default async function EcgSignalAnalysisPage() {
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
