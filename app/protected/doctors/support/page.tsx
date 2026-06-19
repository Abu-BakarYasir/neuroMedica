import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LifeBuoy, Mail, MessageSquare, BookOpen } from "lucide-react";

async function SupportContent() {
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
          <LifeBuoy className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121] dark:text-neutral-100">
            Support
          </h1>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400 mt-0.5">
            We&apos;re here to help you get the most out of Neuro Medica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="mailto:support@neuromedica.app"
          className="rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 hover:border-neuro-primary/30 transition-colors"
        >
          <Mail className="h-5 w-5 text-neuro-primary mb-3" />
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100 mb-1">
            Email support
          </h2>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400">
            support@neuromedica.app — we reply within one business day.
          </p>
        </a>

        <Link
          href="/protected/chat"
          className="rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 hover:border-neuro-primary/30 transition-colors"
        >
          <MessageSquare className="h-5 w-5 text-neuro-primary mb-3" />
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100 mb-1">
            Ask Med Assistant
          </h2>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400">
            Use the in-app assistant for quick how-to questions.
          </p>
        </Link>

        <Link
          href="/protected/doctors/documentation"
          className="rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 hover:border-neuro-primary/30 transition-colors"
        >
          <BookOpen className="h-5 w-5 text-neuro-primary mb-3" />
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100 mb-1">
            Documentation
          </h2>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400">
            Read guides for every clinical tool in the platform.
          </p>
        </Link>

        <div className="rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5">
          <LifeBuoy className="h-5 w-5 text-neuro-primary mb-3" />
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100 mb-1">
            Status &amp; safety
          </h2>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400">
            Neuro Medica assists clinical decisions but does not replace
            professional judgement. Always verify critical information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Loading…</div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
