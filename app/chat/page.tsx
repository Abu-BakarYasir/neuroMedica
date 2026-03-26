import { redirect } from "next/navigation";

/** Chat uses the protected layout (sidebar) at /protected/chat */
export default function ChatPage() {
  redirect("/protected/chat");
}
