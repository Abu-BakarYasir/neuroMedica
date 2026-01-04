import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FullPageChat } from "@/components/chatbot/full-page-chat";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <FullPageChat />;
}


