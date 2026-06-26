/**
 * Guest (logged-out) chatbot responder.
 *
 * Visitors on the public landing page can use the floating chat, but ONLY for
 * general questions about the product (what Neuro Medica is, what it does, who
 * it is for, how to get started). Anything that touches clinical features —
 * patient records, ECG / X-ray analysis, prescriptions, diagnoses, evidence-
 * based medical answers — requires an account, so we answer with a friendly
 * prompt to sign in instead of calling the (auth-gated) backend.
 *
 * All answers here are static and product-scoped: no LLM call, no API cost, and
 * no risk of leaking clinical content to anonymous users.
 */

export interface GuestReply {
  /** Markdown body shown in the assistant bubble. */
  content: string;
  /** True when the question needs an account — the UI surfaces a sign-in CTA. */
  requiresLogin: boolean;
}

/** Link a logged-out visitor uses to authenticate. */
export const GUEST_LOGIN_HREF = "/auth/login";

/**
 * Words that signal the visitor wants a clinical / account-gated capability.
 * Matching any of these routes the turn to the "please sign in" response.
 */
const LOGIN_REQUIRED_KEYWORDS = [
  "patient", "prescription", "prescribe", "diagnos", "ecg", "ekg",
  "x-ray", "xray", "x ray", "radiograph", "chest", "symptom", "treatment",
  "treat ", "dosage", "dose", "medicine", "medication", "drug", "report",
  "scan", "mri", "ct ", "blood", "lab ", "my record", "history", "analyse",
  "analyze", "upload", "diagnosis", "disease", "condition", "therapy",
  "icd", "snomed", "cancer", "tumor", "tumour", "fracture", "pneumonia",
];

/** Greetings get a warm intro rather than a canned FAQ answer. */
const GREETING_RE = /^\s*(hi|hello|hey|heya|yo|good (morning|afternoon|evening)|salam|assalam)/i;

interface Faq {
  /** Any pattern matching the (lowercased) message selects this answer. */
  patterns: RegExp[];
  answer: string;
}

/**
 * General product FAQ. Kept intentionally small and high-level — these are the
 * only topics a logged-out visitor can get a substantive answer on.
 */
const FAQS: Faq[] = [
  {
    patterns: [
      /what (is|are) (neuro\s*medica|this|the (app|platform|product|tool))/i,
      /^what.*neuro/i,
      /tell me about/i,
      /about (neuro\s*medica|this|the (app|platform))/i,
    ],
    answer:
      "**Neuro Medica** is an explainable-AI platform for medical education. It helps medical students, clinicians, and researchers learn from AI — not just *what* the AI predicts, but *why*, with visual explanations, confidence scores, and reference-grounded answers.\n\nIt brings several AI modules into one place:\n\n- **ECG signal analysis** — 12-lead diagnostic insights\n- **Chest X-ray analysis** — with Grad-CAM visual explanations\n- **Prescription scanning** — digitize handwritten prescriptions\n- **Symptom explorer** and **evidence-based medical Q&A** with citations\n\nTo actually use these tools you'll need to sign in.",
  },
  {
    patterns: [
      /what can (you|it|neuro)/i,
      /what.*(do|features|capabilities|offer|help with)/i,
      /how can you help/i,
      /how (do|does) (you|it|this) help/i,
      /^help$/i,
    ],
    answer:
      "I'm the Neuro Medica assistant. On this page I can answer general questions about the platform — what it is, who it's for, and how to get started.\n\nInside the app (after you sign in), Neuro Medica can:\n\n- Analyze **ECG** signals and **chest X-rays** with visual explanations\n- Scan and digitize **prescriptions**\n- Explore **symptoms** and answer **evidence-based medical questions** with citations\n- Generate and save **patient reports**\n\nWant to try it? Just create an account or sign in.",
  },
  {
    patterns: [
      /who (is|are) (it|this|neuro).*for/i,
      /who.*(use|target|audience|for)/i,
      /is (it|this) for (doctors|students|me)/i,
    ],
    answer:
      "Neuro Medica is built for **medical students, clinicians, and researchers** who want to learn with AI they can actually understand. Its explainability features — visual heatmaps, confidence scores, and cited sources — make it especially useful as a teaching and study tool. It assists clinical reasoning but does **not** replace a qualified professional.",
  },
  {
    patterns: [
      /how (does|do) (it|this|neuro).*work/i,
      /explain.*(work|explainab)/i,
      /what.*explainable/i,
    ],
    answer:
      "Neuro Medica pairs each AI prediction with an **explanation** so you can see the reasoning:\n\n- **Visual** — e.g. Grad-CAM heatmaps highlight the regions of an X-ray that drove a finding\n- **Quantitative** — confidence scores accompany each result\n- **Grounded** — medical answers come with **citations** to the literature via a retrieval-augmented (RAG) pipeline\n\nThis is designed for learning, where understanding *why* matters as much as the answer. Sign in to try any module.",
  },
  {
    patterns: [
      /how (do|can) i (get )?start/i,
      /get started/i,
      /sign ?up/i,
      /create.*account/i,
      /how.*(login|log in|sign in)/i,
    ],
    answer:
      "Getting started is quick:\n\n1. **[Create an account or sign in](/auth/login)**\n2. Pick a module — ECG, chest X-ray, prescription scanning, symptom explorer, or medical Q&A\n3. Upload your data or ask a question, and explore the explanations\n\nIt's free to get started — no credit card required.",
  },
  {
    patterns: [
      /(is it|are you|is this).*(free|cost|price|pricing|pay|subscription)/i,
      /how much/i,
      /pricing/i,
    ],
    answer:
      "Neuro Medica is **free to get started — no credit card required**. Create an account to explore the AI modules.",
  },
  {
    patterns: [
      /(is it|are you|is this).*(safe|secure|private|reliable|accurate|trust)/i,
      /can i trust/i,
      /privacy/i,
    ],
    answer:
      "Neuro Medica is designed as an **educational** tool. Every result comes with explanations and confidence scores so you can judge it critically, and medical answers are grounded in cited sources. Important: it **assists** learning and clinical reasoning but does **not** replace a qualified healthcare professional, and it should not be used for real diagnosis or treatment decisions.",
  },
  {
    patterns: [/who (are|r) (you|u)/i, /what are you/i, /your name/i],
    answer:
      "I'm **Neuro Medica AI**, the assistant for the Neuro Medica platform. On this page I can tell you about the product and help you get started. Sign in to unlock the clinical and learning tools.",
  },
];

/** A clinical / account-gated question → prompt the visitor to sign in. */
function loginRequiredReply(): GuestReply {
  return {
    requiresLogin: true,
    content:
      "That's something I can help with once you're signed in. 🔒\n\nClinical features — patient records, ECG and X-ray analysis, prescriptions, and evidence-based medical answers — need an account to keep medical data secure.\n\n**[Sign in or create a free account](/auth/login)** to continue, then ask me again.",
  };
}

/**
 * Decide how to answer a logged-out visitor's message.
 *
 * Order of checks (clinical wording wins, for safety):
 *  1. Anything clinical → ask the visitor to sign in. Checked first so a
 *     clinical question that incidentally matches a general FAQ pattern
 *     (e.g. "what does this x-ray show") is still gated.
 *  2. Greetings → warm intro.
 *  3. A recognised general/product FAQ → that answer.
 *  4. Anything else → sign in (guests only get general product answers).
 */
export function answerGuestMessage(message: string): GuestReply {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Explicitly clinical / account-gated wording → must sign in.
  if (LOGIN_REQUIRED_KEYWORDS.some((kw) => lower.includes(kw))) {
    return loginRequiredReply();
  }

  // 2. Greeting (essentially just a greeting, not one prefixing a real question).
  if (GREETING_RE.test(lower) && text.length <= 40) {
    return {
      requiresLogin: false,
      content:
        "Hi! I'm **Neuro Medica AI** 👋 I can tell you about the platform — what it is, what it does, and how to get started. What would you like to know?",
    };
  }

  // 3. Known general/product question.
  for (const faq of FAQS) {
    if (faq.patterns.some((re) => re.test(lower))) {
      return { requiresLogin: false, content: faq.answer };
    }
  }

  // 4. Unrecognised. Per policy, guests only get general product answers, so we
  //    nudge toward signing in for anything beyond that.
  return loginRequiredReply();
}
