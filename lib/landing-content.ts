// Landing page content library
// All text content, headlines, and structured data for landing page sections

export const heroContent = {
  headline: "Explainable AI for Medical Education",
  subheadline: "A unified platform integrating medical imaging analysis, ECG interpretation, reference-grounded Q&A, and structured report generation—designed for learning, not diagnosis.",
  disclaimer: "⚠️ Educational Use Only • Not for Clinical Decision-Making",
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
    {
      title: "Hallucination Risks",
      description: "AI-generated content may contain inaccuracies or fabricated citations, undermining trust and educational value.",
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
    icon: "🫁",
  },
  {
    id: "ecg-analysis",
    title: "ECG Signal Analysis",
    description: "CSV-based signal processing for rhythm detection, interval analysis, and abnormality flagging with visual plots.",
    learningValue: "Practice ECG interpretation with AI-powered signal analysis and visual feedback on cardiac rhythms.",
    icon: "📈",
  },
  {
    id: "rag-qa",
    title: "Reference-Grounded Q&A",
    description: "Biomedical literature retrieval with citation-backed answers, reducing hallucinations through RAG architecture.",
    learningValue: "Access evidence-based medical knowledge with proper citations, building research skills and critical thinking.",
    icon: "📚",
  },
  {
    id: "medical-ocr",
    title: "Medical OCR",
    description: "Extract structured data from scanned prescriptions and handwritten clinical notes using advanced OCR and NLP.",
    learningValue: "Understand how to digitize and structure medical documents, preparing for modern clinical workflows.",
    icon: "📄",
  },
  {
    id: "symptom-explorer",
    title: "Symptom-to-Disease Explorer",
    description: "NLP-based symptom extraction with ontology mapping (ICD-10/SNOMED) for educational prescription drafting.",
    learningValue: "Learn systematic approaches to symptom analysis and differential diagnosis with structured medical ontologies.",
    icon: "🔍",
  },
  {
    id: "report-generator",
    title: "Unified Report Generator",
    description: "Merge outputs from all modules into editable, structured reports with citation support and PDF export.",
    learningValue: "Practice creating comprehensive medical reports that integrate multiple data sources with proper documentation.",
    icon: "📋",
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

export const explainabilityTrustContent = {
  title: "Explainability & Trust",
  subtitle: "Transparency at every step",
  features: [
    {
      title: "Visual Explanations",
      description: "Grad-CAM heatmaps show which regions of medical images the AI focuses on, helping you understand model reasoning.",
      icon: "👁️",
    },
    {
      title: "Confidence Scores",
      description: "Every prediction includes calibrated confidence scores and uncertainty estimates, so you know when to trust the output.",
      icon: "📊",
    },
    {
      title: "Citations & References",
      description: "All answers are backed by retrievable biomedical literature citations, enabling verification and further learning.",
      icon: "🔗",
    },
    {
      title: "Human-in-the-Loop",
      description: "Edit, validate, and refine AI-generated reports before finalizing—you remain in control of the learning process.",
      icon: "✏️",
    },
  ],
};

export const targetAudienceContent = {
  title: "Who It's For",
  subtitle: "Designed for medical education and research",
  personas: [
    {
      title: "Medical Students",
      description: "Learn to interpret medical images and ECGs with AI assistance. Understand model reasoning through visual explanations and build clinical intuition.",
      icon: "🎓",
    },
    {
      title: "Interns & House Officers",
      description: "Practice structured report generation and evidence-based decision-making. Use AI as a learning tool to refine clinical documentation skills.",
      icon: "👨‍⚕️",
    },
    {
      title: "Clinical Educators",
      description: "Use explainable AI outputs as teaching tools. Demonstrate how AI reasoning aligns with clinical knowledge and where it differs.",
      icon: "👩‍🏫",
    },
    {
      title: "Health-AI Researchers",
      description: "Explore explainable AI architectures, evaluate model interpretability, and study human-AI interaction in medical contexts.",
      icon: "🔬",
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
    {
      title: "OCR + Report Drafting Case",
      scenario: "A student digitizes handwritten clinical notes and creates a structured report.",
      steps: [
        "Upload scanned prescription or handwritten notes",
        "OCR extracts structured data (medications, dosages, dates)",
        "Symptom-to-disease explorer suggests relevant conditions",
        "RAG Q&A provides evidence-based information",
        "Unified report generator combines all outputs",
        "Student edits and refines the report before export",
      ],
      outcome: "Student learns modern clinical documentation workflows and how to integrate multiple data sources.",
    },
  ],
};

export const reportPreviewContent = {
  title: "Structured Report Generation",
  subtitle: "Professional, editable, citation-backed reports",
  features: [
    "Editable sections for all findings",
    "Automatic citation insertion",
    "Visual explanations embedded",
    "Confidence scores displayed",
    "PDF export with references",
    "Template customization",
  ],
  sampleSections: [
    "Patient Information",
    "Clinical History",
    "Imaging Findings",
    "ECG Analysis",
    "Differential Diagnosis",
    "Recommendations",
    "References",
  ],
};

export const ethicsPrivacyContent = {
  title: "Ethics, Privacy & Safety",
  subtitle: "Responsible AI for medical education",
  points: [
    {
      title: "Educational Use Only",
      description: "This platform is strictly for educational purposes. It is not intended for clinical decision-making or patient diagnosis.",
      icon: "⚠️",
    },
    {
      title: "No Medical Advice",
      description: "All outputs are educational tools. They do not constitute medical advice, diagnosis, or treatment recommendations.",
      icon: "🚫",
    },
    {
      title: "Data Privacy",
      description: "User data is handled with care. No patient data is stored permanently. Uploads are processed securely and can be deleted.",
      icon: "🔒",
    },
    {
      title: "Hallucination Mitigation",
      description: "RAG architecture and citation verification reduce AI hallucinations. All answers include source references for verification.",
      icon: "✅",
    },
    {
      title: "Bias Awareness",
      description: "We acknowledge potential biases in training data and model outputs. Users are encouraged to critically evaluate all AI predictions.",
      icon: "⚖️",
    },
  ],
};

export const technologyContent = {
  title: "Technology & Research Credibility",
  subtitle: "Built on modern, explainable AI architectures",
  technologies: [
    {
      name: "Vision Models",
      description: "CNNs and Vision Transformers for medical image analysis",
    },
    {
      name: "Biomedical RAG",
      description: "Retrieval-Augmented Generation with medical literature databases",
    },
    {
      name: "Signal Processing",
      description: "ML-based ECG signal analysis and rhythm detection",
    },
    {
      name: "OCR & NLP",
      description: "Advanced document processing and natural language understanding",
    },
    {
      name: "Modern Web Architecture",
      description: "Next.js, TypeScript, and scalable cloud infrastructure",
    },
  ],
};

export const roadmapContent = {
  title: "Future Vision",
  subtitle: "Continuous improvement and academic growth",
  roadmap: [
    {
      phase: "Phase 1",
      title: "Core Modules",
      items: ["Chest X-ray analysis", "ECG processing", "RAG Q&A", "Report generation"],
      status: "Current",
    },
    {
      phase: "Phase 2",
      title: "Enhanced Explainability",
      items: ["Advanced visualization tools", "Interactive model exploration", "Comparative analysis"],
      status: "Planned",
    },
    {
      phase: "Phase 3",
      title: "Extended Capabilities",
      items: ["Additional imaging modalities", "Multi-modal analysis", "Collaborative features"],
      status: "Future",
    },
  ],
};

export const finalCtaContent = {
  title: "Ready to Enhance Your Medical Education?",
  subtitle: "Join medical students, clinicians, and researchers using explainable AI for learning",
  primaryCta: "Get Started",
  secondaryCta: "Learn More",
  disclaimer: "Free for educational use • No credit card required",
};

export const footerContent = {
  links: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  disclaimer: "This platform is for educational purposes only. It is not intended for clinical decision-making or patient diagnosis.",
  copyright: "© 2024 Neuro Medica. All rights reserved.",
};

