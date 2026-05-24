"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/doctors/sidebar";
import { DashboardLayout } from "@/components/doctors/dashboard-layout";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/protected/chat";

  if (isChatRoute) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
        {children}
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-background text-foreground p-4 gap-4 overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-hidden">
        <DashboardLayout>{children}</DashboardLayout>
      </div>

      <ChatbotWidget />
    </main>
  );
}
