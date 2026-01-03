// Doctor dashboard content library
// All text content, data, and structured information for doctor dashboard sections

export const doctorWelcomeContent = {
  greeting: "Welcome back, Dr.",
  subtitle: "Your clinical dashboard",
};

export const patientManagementContent = {
  title: "Patient Management",
  stats: [
    {
      id: "total-patients",
      label: "Total Patients",
      value: 247,
      trend: "up",
      comparison: "vs. last month",
      icon: "/assets/icons/total-patients-icon.svg",
    },
    {
      id: "active-patients",
      label: "Active Patients",
      value: 189,
      trend: "up",
      comparison: "vs. last month",
      icon: "/assets/icons/active-patients-icon.svg",
    },
    {
      id: "new-patients",
      label: "New This Month",
      value: 23,
      trend: "neutral",
      comparison: "vs. last month",
      icon: "/assets/icons/total-patients-icon.svg",
    },
  ],
  quickActions: [
    {
      label: "Add New Patient",
      icon: "plus",
      href: "#",
    },
    {
      label: "View All Patients",
      icon: "users",
      href: "#",
    },
  ],
};

export const clinicalToolsContent = {
  title: "Clinical Tools",
  subtitle: "Access AI-powered medical analysis tools",
  tools: [
    {
      id: "chest-xray",
      name: "Chest X-ray Analysis",
      description: "Multi-label classification with visual explanations",
      icon: "Stethoscope",
      href: "#",
      color: "from-neuro-primary/10 to-neuro-primary/5",
    },
    {
      id: "ecg-analysis",
      name: "ECG Signal Analysis",
      description: "Rhythm detection and interval analysis",
      icon: "Activity",
      href: "#",
      color: "from-blue-100 to-blue-50",
    },
    {
      id: "rag-qa",
      name: "Medical Q&A",
      description: "Reference-grounded answers with citations",
      icon: "BookOpen",
      href: "#",
      color: "from-green-100 to-green-50",
    },
    {
      id: "medical-ocr",
      name: "Medical OCR",
      description: "Extract data from prescriptions and notes",
      icon: "FileText",
      href: "#",
      color: "from-purple-100 to-purple-50",
    },
    {
      id: "symptom-explorer",
      name: "Symptom Explorer",
      description: "Symptom-to-disease mapping with ontologies",
      icon: "Search",
      href: "#",
      color: "from-orange-100 to-orange-50",
    },
    {
      id: "report-generator",
      name: "Report Generator",
      description: "Create structured medical reports",
      icon: "FileCheck",
      href: "#",
      color: "from-pink-100 to-pink-50",
    },
  ],
};

export const recentActivityContent = {
  title: "Recent Activity",
  subtitle: "Your latest reports and analyses",
  activities: [
    {
      id: "1",
      type: "Chest X-ray Analysis",
      patient: "John Doe",
      date: "2 hours ago",
      status: "completed",
      reportId: "RPT-2024-001",
    },
    {
      id: "2",
      type: "ECG Analysis",
      patient: "Jane Smith",
      date: "5 hours ago",
      status: "completed",
      reportId: "RPT-2024-002",
    },
    {
      id: "3",
      type: "Medical Report",
      patient: "Robert Johnson",
      date: "1 day ago",
      status: "completed",
      reportId: "RPT-2024-003",
    },
    {
      id: "4",
      type: "Chest X-ray Analysis",
      patient: "Emily Davis",
      date: "2 days ago",
      status: "completed",
      reportId: "RPT-2024-004",
    },
    {
      id: "5",
      type: "Medical Q&A",
      patient: "Michael Brown",
      date: "3 days ago",
      status: "completed",
      reportId: "RPT-2024-005",
    },
  ],
};

export const notificationsContent = {
  title: "Notifications",
  notifications: [
    {
      id: "1",
      type: "alert",
      title: "AI Predictive Alert",
      message: "New pattern detected in patient ECG analysis",
      time: "30 minutes ago",
      unread: true,
      priority: "high",
    },
    {
      id: "2",
      type: "info",
      title: "Report Ready",
      message: "Your chest X-ray analysis report is ready for review",
      time: "2 hours ago",
      unread: true,
      priority: "medium",
    },
    {
      id: "3",
      type: "reminder",
      title: "Follow-up Reminder",
      message: "Patient follow-up scheduled for tomorrow",
      time: "1 day ago",
      unread: false,
      priority: "low",
    },
    {
      id: "4",
      type: "alert",
      title: "System Update",
      message: "New features available in ECG analysis module",
      time: "2 days ago",
      unread: false,
      priority: "low",
    },
  ],
};

export const medicalResourcesContent = {
  title: "Medical Resources",
  subtitle: "Quick access to medical references and documentation",
  resources: [
    {
      id: "1",
      name: "Biomedical Literature",
      description: "Access peer-reviewed medical journals",
      icon: "BookOpen",
      href: "#",
    },
    {
      id: "2",
      name: "ICD-10 Codes",
      description: "International classification of diseases",
      icon: "FileText",
      href: "#",
    },
    {
      id: "3",
      name: "SNOMED CT",
      description: "Systematized nomenclature of medicine",
      icon: "Database",
      href: "#",
    },
    {
      id: "4",
      name: "Clinical Guidelines",
      description: "Evidence-based clinical practice guidelines",
      icon: "FileCheck",
      href: "#",
    },
  ],
};


