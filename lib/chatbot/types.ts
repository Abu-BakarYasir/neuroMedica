export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  error?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: Message[];
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
}

export interface ChatApiError {
  message: string;
  code?: string;
  status?: number;
}



