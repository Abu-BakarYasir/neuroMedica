import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClinicalComingSoon } from "@/components/doctors/clinical-coming-soon";
import { Stethoscope } from "lucide-react";

export default async function ChestXRayPage() {
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
