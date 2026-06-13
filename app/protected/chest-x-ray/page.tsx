import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CxrAnalyzer } from "@/components/cxr/cxr-analyzer";

async function ChestXRayGate() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <CxrAnalyzer />;
}

export default function ChestXRayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-sm text-[#525252]">
          Loading…
        </div>
      }
    >
      <ChestXRayGate />
    </Suspense>
  );
}
