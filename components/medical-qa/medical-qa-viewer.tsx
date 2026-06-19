"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpen, Loader2, Send, AlertCircle, Trash2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendMessageStreaming } from "@/lib/chatbot/api-client";
import type { Message } from "@/lib/chatbot/types";
import { ChatMessage } from "@/components/chatbot/chat-message";
import { AddToReportButton } from "@/components/report-generator/add-to-report-button";
import { qaToItem } from "@/lib/report/serialize";

interface QaTurn {
  id: string;
  question: Message;
  answer: Message;
}

const EXAMPLE_QUESTIONS = [
  "What are the latest blood-pressure targets for hypertension?",
  "First-line antibiotics for community-acquired pneumonia?",
  "What are the contraindications for metformin?",
  "Summarize the evidence for SGLT2 inhibitors in heart failure.",
];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

export function MedicalQaViewer() {
  const [turns, setTurns] = useState<QaTurn[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const patchAnswer = useCallback(
    (turnId: string, patch: Partial<Message>) => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, answer: { ...t.answer, ...patch } } : t,
        ),
      );
    },
    [],
  );

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || isStreaming) return;

      const turnId = newId();
      const userMsg: Message = {
        id: `${turnId}-q`,
        role: "user",
        content: question,
        timestamp: new Date(),
      };
      const answerMsg: Message = {
        id: `${turnId}-a`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        usedRag: true,
      };

      setTurns((prev) => [...prev, { id: turnId, question: userMsg, answer: answerMsg }]);
      setInput("");
      setIsStreaming(true);
      setError(null);

      try {
        // Single-shot, always evidence-grounded: no conversation id, no history.
        await sendMessageStreaming(question, undefined, [], true, {
          onMeta: (meta) =>
            patchAnswer(turnId, {
              citations: meta.citations,
              confidence: meta.confidence,
              disclaimer: meta.disclaimer,
            }),
          onDelta: (text) =>
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? { ...t, answer: { ...t.answer, content: t.answer.content + text } }
                  : t,
              ),
            ),
          onError: (msg) => {
            patchAnswer(turnId, { error: true, content: msg, usedRag: false });
            setError(msg);
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to answer this question";
        // If nothing streamed in, surface the failure on the answer card.
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId && !t.answer.content
              ? { ...t, answer: { ...t.answer, error: true, content: msg, usedRag: false } }
              : t,
          ),
        );
        setError(msg);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, patchAnswer],
  );

  const onSubmit = () => void ask(input);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const clearSession = () => {
    if (isStreaming) return;
    setTurns([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  };

  // Newest Q&A first, so the latest answer sits right under the question box.
  const orderedTurns = [...turns].reverse();
  const awaitingFirstToken =
    isStreaming && turns.length > 0 && !turns[turns.length - 1].answer.content;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121]">Medical Q&amp;A</h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Reference-grounded answers with citations from biomedical literature,
            FDA labels, RxNorm, and clinical guidelines.
          </p>
        </div>
      </div>

      {/* Question box */}
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          placeholder="Ask a clinical question — e.g. “What is the first-line treatment for type 2 diabetes?”"
          className="w-full resize-none bg-transparent px-2 py-1.5 text-[14px] text-[#212121] placeholder:text-[#9a9a9a] focus:outline-none"
          disabled={isStreaming}
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-[#9a9a9a]">
            Evidence-grounded · educational use only
          </span>
          <div className="flex items-center gap-2">
            {turns.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearSession}
                disabled={isStreaming}
                className="text-[#767676]"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isStreaming || !input.trim()}
              className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ask
            </Button>
          </div>
        </div>
      </div>

      {/* Example questions (empty state only) */}
      {turns.length === 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-[12px] text-[#767676] mb-3">
            <Sparkles className="h-3.5 w-3.5 text-neuro-primary" />
            Try one of these
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void ask(q)}
                disabled={isStreaming}
                className="text-left rounded-[12px] border border-[#E5E5E5] bg-white px-4 py-3 text-[13px] text-[#374151] hover:border-neuro-primary/40 hover:bg-neuro-primary/5 transition-colors disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800">
              Could not answer this question
            </div>
            <p className="text-[12px] text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Q&A feed (newest first) */}
      {orderedTurns.length > 0 && (
        <div className="mt-6 divide-y divide-[#F0F0F0]">
          {orderedTurns.map((t) => (
            <div key={t.id} className="py-1">
              <ChatMessage message={t.question} />
              {awaitingFirstToken && t.id === turns[turns.length - 1].id ? (
                <div className="flex items-center gap-3 px-1 py-4 text-[13px] text-[#525252]">
                  <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
                  Searching the literature and grounding the answer…
                </div>
              ) : (
                <>
                  <ChatMessage message={t.answer} />
                  {t.answer.content && !t.answer.error && (
                    <div className="flex justify-end px-1 pb-2">
                      <AddToReportButton
                        className="h-8"
                        build={() =>
                          qaToItem(
                            t.question.content,
                            t.answer.content,
                            t.answer.citations ?? [],
                          )
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
