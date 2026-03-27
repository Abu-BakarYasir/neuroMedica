# Persistent Chat Memory

Multi-conversation chat system with persistent history, similar to ChatGPT and Claude.

## Overview

Users can create multiple conversations, switch between them, and access their full chat history across sessions. Each conversation persists in Supabase PostgreSQL with Row-Level Security ensuring data isolation per user.

## Features

- **Multiple conversations** - each chat is a separate conversation with its own history
- **New Chat button** - starts a fresh conversation instantly
- **Chat history sidebar** - collapsible panel showing all past conversations grouped by date
- **Conversation search** - search across conversation titles and message content (full-text search)
- **LLM-generated titles** - after the first message exchange, an LLM generates a short descriptive title
- **Inline rename** - click the pencil icon to rename any conversation
- **Delete with undo** - deleting a conversation shows a 5-second undo toast before permanent deletion
- **Persistent messages** - every user and assistant message is saved to the database automatically
- **Collapsible sidebar** - toggle the sidebar open/closed (Claude-style)

## Architecture

```
User sends message
    |
    v
[FullPageChat] -- orchestrates sidebar + chat window
    |
    |-- [useConversations] -- manages conversation list (Supabase)
    |     |-- createConversation()
    |     |-- listConversations()
    |     |-- deleteConversation() (with 5s undo)
    |     |-- searchConversations() (title + full-text content)
    |     |-- rename()
    |
    |-- [useChat] -- manages messages for active conversation
          |-- loadMessages(conversationId) -- on conversation switch
          |-- saveMessage() -- after each user/assistant message
          |-- generateTitle() -- after first exchange
          |-- sendMessage() -- calls backend API
```

## Database Schema

### conversations

| Column     | Type        | Description                    |
|------------|-------------|--------------------------------|
| id         | uuid (PK)   | Auto-generated                 |
| user_id    | uuid (FK)   | References auth.users          |
| title      | text        | Conversation title             |
| created_at | timestamptz | When conversation was created  |
| updated_at | timestamptz | Auto-updated on new messages   |

### messages

| Column          | Type        | Description                              |
|-----------------|-------------|------------------------------------------|
| id              | uuid (PK)   | Auto-generated                           |
| conversation_id | uuid (FK)   | References conversations (cascade delete)|
| role            | text        | 'user', 'assistant', or 'system'         |
| content         | text        | Message text                             |
| used_rag        | boolean     | Whether RAG pipeline was used            |
| citations       | jsonb       | PubMed citation data (if RAG)            |
| confidence      | text        | RAG confidence level                     |
| disclaimer      | text        | Medical disclaimer text                  |
| created_at      | timestamptz | Message timestamp                        |

### Row-Level Security

- Users can only read/write/delete their own conversations
- Users can only read/write/delete messages within their own conversations
- Enforced at the database level via Supabase RLS policies

### Trigger

An `AFTER INSERT` trigger on `messages` automatically updates the parent conversation's `updated_at` timestamp, keeping the sidebar sorted by most recent activity.

## File Map

### Database
| File | Purpose |
|------|---------|
| `supabase/MIGRATION_RULES.md` | Migration guidelines for shared database |
| `supabase/schema.sql` | Full schema snapshot (reference) |
| `supabase/migrations/001_create_conversations.sql` | Conversations table + RLS |
| `supabase/migrations/002_create_messages.sql` | Messages table + RLS + trigger |

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/chat.py` | Added `POST /api/chat/generate-title` endpoint |
| `backend/app/services/chat_service.py` | Added `generate_title()` method using Groq |

### Frontend - Services & Hooks
| File | Purpose |
|------|---------|
| `lib/chatbot/types.ts` | Added `Conversation` and `DbMessage` types |
| `lib/chatbot/conversation-service.ts` | Supabase CRUD for conversations/messages |
| `lib/chatbot/use-conversations.ts` | Hook for conversation list management |
| `lib/chatbot/hooks.ts` | Refactored `useChat` for DB persistence |

### Frontend - UI Components
| File | Purpose |
|------|---------|
| `components/chatbot/chat-sidebar.tsx` | Collapsible sidebar with search, grouping, rename, delete |
| `components/chatbot/chat-window.tsx` | Updated to accept external props |
| `components/chatbot/chatbot-header.tsx` | Updated with sidebar toggle button |
| `components/chatbot/full-page-chat.tsx` | Layout orchestrator (sidebar + chat) |
| `components/chatbot/chat-window-mini.tsx` | Standalone chat for floating widget |
| `components/chatbot/chatbot-widget.tsx` | Updated to use mini chat window |

### API Routes
| File | Purpose |
|------|---------|
| `app/api/chat/title/route.ts` | Next.js proxy for title generation |

## Setup

1. Run the migrations in order in your Supabase SQL Editor:
   - `supabase/migrations/001_create_conversations.sql`
   - `supabase/migrations/002_create_messages.sql`

2. Verify in Supabase Table Editor that both tables exist with RLS enabled.

3. Start the app normally (`npm run dev` + backend).

## How It Works

### Starting a new chat
1. User clicks "New Chat" in sidebar (or sends a message with no active conversation)
2. A new row is inserted into `conversations` with title "New Chat"
3. The conversation becomes active and ready for messages

### Sending a message
1. User message is added to UI immediately (optimistic)
2. User message is saved to `messages` table
3. Message is sent to backend API for processing
4. Assistant response is added to UI
5. Assistant response is saved to `messages` table (with RAG metadata if applicable)
6. If this is the first exchange, LLM generates a title asynchronously

### Switching conversations
1. User clicks a conversation in the sidebar
2. `useChat` detects the `conversationId` change
3. Messages are loaded from Supabase for that conversation
4. Chat window renders the loaded messages

### Searching
1. User types in the search bar (debounced 300ms)
2. Search queries both conversation titles (ILIKE) and message content (full-text search)
3. Results replace the conversation list

### Deleting
1. User clicks the trash icon on a conversation
2. Conversation is immediately hidden from the UI
3. A 5-second undo toast appears
4. If not undone, the conversation is hard-deleted from the database (cascade deletes all messages)
5. If undone, the conversation is restored to the list
