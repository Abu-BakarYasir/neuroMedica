import { Sidebar } from "@/components/doctors/sidebar";
import { DashboardLayout } from "@/components/doctors/dashboard-layout";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen bg-white p-4 gap-4 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <DashboardLayout>{children}</DashboardLayout>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </main>
  );
}
