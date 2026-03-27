import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClinicalComingSoon } from "@/components/doctors/clinical-coming-soon";
import { Stethoscope } from "lucide-react";

async function ChestXRayContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <ClinicalComingSoon
      title="Chest X-ray Analysis"
      description="Multi-label classification with visual explanations"
      Icon={Stethoscope}
    />
  );
}

export default function ChestXRayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <ChestXRayContent />
    </Suspense>
  );
}
