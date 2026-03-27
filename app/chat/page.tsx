import { Suspense } from "react";
import { ChatPageInner } from "./chat-page-inner";

function ChatLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600 text-sm">
      Loading chat…
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatPageInner />
    </Suspense>
  );
}





