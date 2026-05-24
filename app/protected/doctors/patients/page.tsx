import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientsList } from "@/components/doctors/patients-list";

async function PatientsContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <PatientsList />;
}

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading…
        </div>
      }
    >
      <PatientsContent />
    </Suspense>
  );
}
