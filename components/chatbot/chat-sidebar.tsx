"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquarePlus,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/lib/chatbot/types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  searchQuery: string;
  pendingDelete: { id: string; title: string } | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onUndoDelete: () => void;
  onSearch: (query: string) => void;
  onClose: () => void;
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Previous 30 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updated_at);
    if (date >= today) groups[0].items.push(conv);
    else if (date >= yesterday) groups[1].items.push(conv);
    else if (date >= weekAgo) groups[2].items.push(conv);
    else if (date >= monthAgo) groups[3].items.push(conv);
    else groups[4].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5">
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="flex-1 text-sm bg-white dark:bg-[hsl(var(--surface-card))] text-gray-800 dark:text-neutral-100 border border-gray-300 dark:border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neuro-primary"
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`group w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-neuro-primary/10 dark:bg-neuro-primary/20 text-neuro-primary-dark dark:text-[#F7A47A] font-medium"
          : "text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-white/5"
      }`}
    >
      <span className="flex-1 truncate">{conversation.title}</span>
      <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-200"
        >
          <Pencil className="w-3 h-3" />
        </span>
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-neutral-400 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </span>
      </span>
    </button>
  );
}

export function ChatSidebar({
  conversations,
  activeId,
  isLoading,
  searchQuery,
  pendingDelete,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onUndoDelete,
  onSearch,
  onClose,
}: ChatSidebarProps) {
  const groups = groupByDate(conversations);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--surface-panel))] border-r border-border">
      {/* Header — brand + collapse */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-semibold">MA</span>
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            Med Assistant
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* New chat button */}
      <div className="px-2 pt-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm font-medium h-9 bg-card hover:bg-muted border-border"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search chats…"
            className="pl-8 h-8 text-sm bg-card border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No results found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new chat to begin
              </p>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={() => onSelect(conv.id)}
                  onRename={(title) => onRename(conv.id, title)}
                  onDelete={() => onDelete(conv.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Undo delete toast */}
      {pendingDelete && (
        <div className="mx-2 mb-2 p-3 bg-gray-800 dark:bg-neutral-900 text-white rounded-lg flex items-center justify-between text-sm animate-in slide-in-from-bottom-2 border border-transparent dark:border-white/10">
          <span className="truncate mr-2">
            Deleted &ldquo;{pendingDelete.title}&rdquo;
          </span>
          <button
            onClick={onUndoDelete}
            className="shrink-0 text-blue-300 hover:text-blue-200 font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
