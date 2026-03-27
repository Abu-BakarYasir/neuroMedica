export type MessageRole = "user" | "assistant" | "system";

export interface CitationItem {
  index: number;
  pmid: string;
  title: string;
  journal?: string;
  doi?: string | null;
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





