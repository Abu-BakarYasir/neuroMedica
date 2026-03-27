"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatWindow } from "./chat-window";
import { ChatSidebar } from "./chat-sidebar";
import { useConversations } from "@/lib/chatbot/use-conversations";
import { useChat } from "@/lib/chatbot/hooks";

export function FullPageChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const conversations = useConversations();

  // Queue a message to send after conversation creation
  const pendingMessageRef = useRef<string | null>(null);

  const handleTitleGenerated = useCallback(
    (id: string, title: string) => {
      conversations.updateLocal(id, { title });
    },
    [conversations]
  );

  const chat = useChat({
    conversationId: conversations.activeId,
    onTitleGenerated: handleTitleGenerated,
  });

  // Send pending message once conversationId becomes available
  useEffect(() => {
    if (conversations.activeId && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      chat.sendMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.activeId]);

  const handleNewChat = useCallback(async () => {
    await conversations.create();
  }, [conversations]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      conversations.select(id);
    },
    [conversations]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversations.activeId) {
        // Create conversation first, then queue the message
        pendingMessageRef.current = content;
        await conversations.create();
        return;
      }
      chat.sendMessage(content);
    },
    [conversations, chat]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 shrink-0 h-full">
          <ChatSidebar
            conversations={conversations.conversations}
            activeId={conversations.activeId}
            isLoading={conversations.isLoading}
            searchQuery={conversations.searchQuery}
            pendingDelete={conversations.pendingDelete}
            onNewChat={handleNewChat}
            onSelect={handleSelectConversation}
            onRename={conversations.rename}
            onDelete={conversations.remove}
            onUndoDelete={conversations.undoDelete}
            onSearch={conversations.search}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 container mx-auto max-w-4xl py-6 px-4">
          <ChatWindow
            messages={chat.messages}
            isLoading={chat.isLoading}
            isLoadingHistory={chat.isLoadingHistory}
            useRag={chat.useRag}
            onSendMessage={handleSendMessage}
            onUseRagChange={chat.setUseRag}
            onToggleSidebar={
              sidebarOpen ? undefined : () => setSidebarOpen(true)
            }
          />
        </div>
      </div>
    </div>
  );
}
