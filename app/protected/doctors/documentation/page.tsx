import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Stethoscope, Activity, FileText, MessageSquare } from "lucide-react";

const SECTIONS = [
  {
    icon: Stethoscope,
    title: "Chest X-ray Analysis",
    body: "Upload a chest X-ray to get multi-label thoracic pathology predictions with visual explanations.",
    href: "/protected/chest-x-ray",
  },
  {
    icon: Activity,
    title: "ECG Signal Analysis",
    body: "Upload an ECG signal CSV (one beat per row, or a raw single-column signal) for AAMI EC57 heartbeat classification.",
    href: "/protected/ecg-signal-analysis",
  },
  {
    icon: FileText,
    title: "Prescription OCR",
    body: "Scan a handwritten or printed prescription to automatically extract patient details and medications.",
    href: "/protected/doctors#prescription-ocr",
  },
  {
    icon: MessageSquare,
    title: "Med Assistant (RAG chat)",
    body: "Ask clinical questions and get reference-grounded answers with citations. Toggle Evidence-based mode for retrieval.",
    href: "/protected/chat",
  },
];

async function DocumentationContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121] dark:text-neutral-100">
            Documentation
          </h1>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400 mt-0.5">
            Quick guides to each tool in Neuro Medica.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-start gap-3 rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 hover:border-neuro-primary/30 transition-colors"
            >
              <Icon className="h-5 w-5 text-neuro-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100 mb-1">
                  {s.title}
                </h2>
                <p className="text-[13px] text-[#525252] dark:text-neutral-400">
                  {s.body}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Loading…</div>
      }
    >
      <DocumentationContent />
    </Suspense>
  );
}
