import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MedicalQaViewer } from "@/components/medical-qa/medical-qa-viewer";

async function MedicalQaContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <MedicalQaViewer />;
}

export default function MedicalQaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <MedicalQaContent />
    </Suspense>
  );
}
