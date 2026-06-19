import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildDisplayName } from "@/lib/auth/user-display";
import { Settings as SettingsIcon, KeyRound, User } from "lucide-react";

async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const displayName = buildDisplayName(user);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <SettingsIcon className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121] dark:text-neutral-100">
            Settings
          </h1>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400 mt-0.5">
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-neuro-primary" />
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100">
            Account
          </h2>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#838383] dark:text-neutral-400">Name</dt>
            <dd className="text-[#212121] dark:text-neutral-100 font-medium text-right">
              {displayName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#838383] dark:text-neutral-400">Email</dt>
            <dd className="text-[#212121] dark:text-neutral-100 font-medium text-right break-all">
              {user.email}
            </dd>
          </div>
        </dl>
      </div>

      <Link
        href="/auth/update-password"
        className="flex items-center gap-3 rounded-[16px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-5 hover:border-neuro-primary/30 transition-colors"
      >
        <KeyRound className="h-5 w-5 text-neuro-primary flex-shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-[#212121] dark:text-neutral-100">
            Change password
          </h2>
          <p className="text-[13px] text-[#525252] dark:text-neutral-400">
            Update the password you use to sign in.
          </p>
        </div>
      </Link>

      <p className="text-[12px] text-[#838383] dark:text-neutral-500 mt-4">
        Tip: switch between light and dark themes using the toggle at the top of
        the sidebar.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Loading…</div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
