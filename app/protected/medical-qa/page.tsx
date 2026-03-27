import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClinicalComingSoon } from "@/components/doctors/clinical-coming-soon";
import { BookOpen } from "lucide-react";

async function MedicalQaContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <ClinicalComingSoon
      title="Medical Q&A"
      description="Reference-grounded answers with citations"
      Icon={BookOpen}
    />
  );
}

export default function MedicalQaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <MedicalQaContent />
    </Suspense>
  );
}
