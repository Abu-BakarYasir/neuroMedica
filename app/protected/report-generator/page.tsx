import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportGenerator } from "@/components/report-generator/report-generator";

async function ReportGeneratorContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <ReportGenerator />;
}

export default function ReportGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Loading…</div>
      }
    >
      <ReportGeneratorContent />
    </Suspense>
  );
}
