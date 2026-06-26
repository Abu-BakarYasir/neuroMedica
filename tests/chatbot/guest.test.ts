import { describe, it, expect } from "vitest";
import { answerGuestMessage } from "@/lib/chatbot/guest";

describe("answerGuestMessage", () => {
  it("answers a general 'what is' product question without login", () => {
    const reply = answerGuestMessage("What is Neuro Medica?");
    expect(reply.requiresLogin).toBe(false);
    expect(reply.content.toLowerCase()).toContain("neuro medica");
  });

  it("answers 'how can you help' without login", () => {
    const reply = answerGuestMessage("How can you help me?");
    expect(reply.requiresLogin).toBe(false);
  });

  it("greets a bare greeting without login", () => {
    const reply = answerGuestMessage("hi");
    expect(reply.requiresLogin).toBe(false);
  });

  it("gates a clinical question behind sign-in", () => {
    const reply = answerGuestMessage("Analyze this patient's ECG for me");
    expect(reply.requiresLogin).toBe(true);
    expect(reply.content).toContain("/auth/login");
  });

  it("gates prescription / patient questions behind sign-in", () => {
    expect(answerGuestMessage("show me my patient's prescriptions").requiresLogin).toBe(true);
    expect(answerGuestMessage("what does this chest x-ray show?").requiresLogin).toBe(true);
  });

  it("defaults unrecognised questions to sign-in (general-only policy)", () => {
    const reply = answerGuestMessage("what's the capital of France?");
    expect(reply.requiresLogin).toBe(true);
  });
});
