import { Suspense } from "react";
  import { ChatPageInner } from "./chat-page-inner";      
  
  function ChatLoadingFallback() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
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