"use client";

import { ChatWindow } from "./chat-window";

export function FullPageChat() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 container mx-auto max-w-4xl py-6 px-4">
        <ChatWindow showExpandButton={false} />
      </div>
    </div>
  );
}





