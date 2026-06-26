// Landing page content library
// All text content, headlines, and structured data for landing page sections

export const heroContent = {
  headline: "Explainable AI for Medical Education",
  subheadline: "A unified platform integrating medical imaging analysis, ECG interpretation, reference-grounded Q&A, and structured report generation.",
  primaryCta: "Get Started",
  secondaryCta: "Learn More",
};

export const problemSolutionContent = {
  title: "The Challenge: Fragmented Tools, Black-Box AI",
  problems: [
    {
      title: "Fragmented Workflows",
      description: "Medical students juggle multiple disconnected tools for imaging, ECG analysis, and literature review—no unified learning environment.",
    },
    {
      title: "Black-Box Predictions",
      description: "Traditional AI systems provide predictions without explanations, making it difficult to understand reasoning and build clinical intuition.",
    },
  ],
  solution: {
    title: "The Solution: Unified, Explainable, Citation-Backed",
    description: "Neuro Medica integrates multiple AI modules into a single platform with visual explanations, confidence scores, and reference-grounded answers—all designed for educational use.",
    features: [
      "Unified workflow across all medical AI tasks",
      "Visual explanations (Grad-CAM) for imaging analysis",
      "Confidence scores and uncertainty quantification",
      "Citation-backed answers from biomedical literature",
      "Human-in-the-loop editing and validation",
    ],
  },
};

export const capabilitiesContent = [
  {
    id: "chest-xray",
    title: "Chest X-ray Intelligence",
    description: "Multi-label classification with calibrated confidence scores and Grad-CAM visualizations to understand model attention.",
    learningValue: "Learn to interpret chest X-rays with AI assistance, understanding both predictions and the reasoning behind them.",
  },
  {
    id: "ecg-analysis",
    title: "ECG Signal Analysis",
    description: "CSV-based signal processing for rhythm detection, interval analysis, and abnormality flagging with visual plots.",
    learningValue: "Practice ECG interpretation with AI-powered signal analysis and visual feedback on cardiac rhythms.",
  },
  {
    id: "rag-qa",
    title: "Reference-Grounded Q&A",
    description: "Biomedical literature retrieval with citation-backed answers, reducing hallucinations through RAG architecture.",
    learningValue: "Access evidence-based medical knowledge with proper citations, building research skills and critical thinking.",
  },
  {
    id: "medical-ocr",
    title: "Medical OCR",
    description: "Extract structured data from scanned prescriptions and handwritten clinical notes using advanced OCR and NLP.",
    learningValue: "Understand how to digitize and structure medical documents, preparing for modern clinical workflows.",
  },
  {
    id: "symptom-explorer",
    title: "Symptom-to-Disease Explorer",
    description: "NLP-based symptom extraction with ontology mapping (ICD-10/SNOMED) for educational prescription drafting.",
    learningValue: "Learn systematic approaches to symptom analysis and differential diagnosis with structured medical ontologies.",
  },
  {
    id: "report-generator",
    title: "Unified Report Generator",
    description: "Merge outputs from all modules into editable, structured reports with citation support and PDF export.",
    learningValue: "Practice creating comprehensive medical reports that integrate multiple data sources with proper documentation.",
  },
];

export const howItWorksContent = {
  title: "How the System Works",
  subtitle: "A simplified, transparent workflow designed for learning",
  steps: [
    {
      step: 1,
      title: "Input",
      description: "Upload medical images, ECG signals, or enter questions. The system accepts multiple input formats.",
    },
    {
      step: 2,
      title: "AI Modules",
      description: "Specialized AI modules process inputs: vision models for imaging, signal processing for ECG, RAG for Q&A.",
    },
    {
      step: 3,
      title: "Guardrails",
      description: "Confidence scores, uncertainty quantification, and citation verification ensure reliable outputs.",
    },
    {
      step: 4,
      title: "Reports",
      description: "Generate structured, editable reports with visual explanations, citations, and export options.",
    },
  ],
};

export const useCasesContent = {
  title: "Real Use-Case Scenarios",
  subtitle: "See how the platform supports learning",
  cases: [
    {
      title: "Chest X-ray Learning Case",
      scenario: "A medical student uploads a chest X-ray showing signs of pneumonia.",
      steps: [
        "Upload chest X-ray image",
        "AI identifies multiple findings with confidence scores",
        "Grad-CAM visualization highlights lung regions of interest",
        "Student reviews explanations and compares with textbook knowledge",
        "Generate structured report with findings and educational notes",
      ],
      outcome: "Student learns to correlate AI predictions with anatomical features, building pattern recognition skills.",
    },
    {
      title: "ECG Analysis Learning Case",
      scenario: "An intern needs to interpret an ECG signal for a case presentation.",
      steps: [
        "Upload ECG signal (CSV format)",
        "Signal processing identifies rhythm and intervals",
        "Abnormality flags highlight potential issues",
        "Visual plots show signal characteristics",
        "Reference-grounded Q&A provides context on findings",
        "Create presentation-ready report with citations",
      ],
      outcome: "Intern practices systematic ECG interpretation with AI assistance, learning to identify patterns and abnormalities.",
    },
  ],
};

export const statsContent = [
  {
    value: 500,
    suffix: "+",
    label: "Active Users",
  },
  {
    value: 10000,
    suffix: "+",
    label: "Analyses Completed",
  },
  {
    value: 95,
    suffix: "%",
    label: "Accuracy Rate",
  },
  {
    value: 50,
    suffix: "+",
    label: "Medical Institutions",
  },
];

export const socialProofContent = {
  testimonials: [
    {
      quote:
        "Neuro Medica has transformed how I study medical imaging. The visual explanations help me understand not just what the AI sees, but why—which is crucial for building clinical intuition.",
      name: "Sarah Chen",
      role: "Medical Student, Year 3",
    },
    {
      quote:
        "As a clinical educator, I use Neuro Medica to demonstrate AI reasoning to my students. The explainability features make it an excellent teaching tool.",
      name: "Dr. Michael Rodriguez",
      role: "Clinical Educator",
    },
    {
      quote:
        "The citation-backed Q&A feature is a game-changer. I can trust the answers because I can verify every source, which builds my research skills.",
      name: "James Park",
      role: "Medical Student, Year 2",
    },
    {
      quote:
        "The unified platform saves me hours. Instead of switching between multiple tools, everything I need is in one place with consistent explanations.",
      name: "Emily Watson",
      role: "Intern",
    },
  ],
  trustBadges: ["Medical University", "Teaching Hospital", "Research Institute"],
};

export const finalCtaContent = {
  title: "Ready to Enhance Your Medical Education?",
  subtitle: "Join medical students, clinicians, and researchers using explainable AI for learning",
  primaryCta: "Get Started",
  secondaryCta: "Learn More",
  disclaimer: "Free to get started • No credit card required",
};

export const footerContent = {
  links: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Ethics & Safety", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  copyright: "© 2026 Neuro Medica. All rights reserved.",
};

