import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EcgAnalyzer } from "@/components/ecg/ecg-analyzer";

async function EcgGate() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <EcgAnalyzer />;
}

export default function EcgSignalAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-sm text-[#525252]">
          Loading…
        </div>
      }
    >
      <EcgGate />
    </Suspense>
  );
}
