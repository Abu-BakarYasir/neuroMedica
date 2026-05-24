export type MessageRole = "user" | "assistant" | "system";

export type CitationSource = "pubmed" | "openfda" | "rxnorm" | "guideline";

export interface CitationItem {
  index: number;
  pmid: string;
  source_type?: CitationSource;
  title: string;
  journal?: string;
  doi?: string | null;
  url?: string | null;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  error?: boolean;
  /** Present when assistant reply used the RAG pipeline */
  usedRag?: boolean;
  citations?: CitationItem[];
  confidence?: string;
  disclaimer?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: Message[];
  useRag?: boolean;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  error?: string;
  citations?: CitationItem[];
  confidence?: string;
  disclaimer?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  useRag: boolean;
}

export interface ChatApiError {
  message: string;
  code?: string;
  status?: number;
}

// ── Persistent conversation types ──

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  used_rag: boolean;
  citations: CitationItem[] | null;
  confidence: string | null;
  disclaimer: string | null;
  created_at: string;
}





