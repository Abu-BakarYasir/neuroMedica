import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SymptomExplorer } from "@/components/symptom-explorer/symptom-explorer";

async function SymptomExplorerContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <SymptomExplorer />;
}

export default function SymptomExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Loading…</div>
      }
    >
      <SymptomExplorerContent />
    </Suspense>
  );
}
