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
  // Track the previous history-loading state so we can detect the moment a
  // freshly created conversation finishes its (empty) history load.
  const prevLoadingHistoryRef = useRef(false);

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

  // Send the queued first message only AFTER the new conversation's history
  // has finished loading. Sending earlier races the load effect inside useChat,
  // whose async resolve would overwrite (and visibly drop) the optimistic
  // user message and streaming reply.
  useEffect(() => {
    const wasLoading = prevLoadingHistoryRef.current;
    prevLoadingHistoryRef.current = chat.isLoadingHistory;

    // Fire only on the true -> false transition: history has loaded for the new
    // conversation, so the optimistic message can no longer be clobbered.
    const historyJustSettled = wasLoading && !chat.isLoadingHistory;
    if (
      historyJustSettled &&
      conversations.activeId &&
      pendingMessageRef.current
    ) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      chat.sendMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.activeId, chat.isLoadingHistory]);

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
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-[260px] shrink-0 h-full">
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

      {/* Chat area — fills page, ChatWindow controls its own content max-width */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
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
  );
}
