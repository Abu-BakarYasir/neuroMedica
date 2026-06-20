// Sidebar navigation configuration
// Navigation items for doctor dashboard sidebar

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  section?: "main" | "settings" | "help";
}

export const mainNavigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/protected/doctors",
    icon: "/assets/sidebar-icons/dashboard-icon.svg",
    section: "main",
  },
  {
    id: "patients",
    name: "Patients",
    href: "/protected/doctors/patients",
    icon: "/assets/sidebar-icons/patients-icon.svg",
    section: "main",
  },
  {
    id: "chatbot",
    name: "Chatbot",
    href: "/protected/chat",
    icon: "/assets/sidebar-icons/chatbot-icon.svg",
    section: "main",
  },
];

/** Sidebar links for the three flagship clinical AI tools (same as dashboard cards). */
export const clinicalToolsSidebarItems: NavigationItem[] = [
  {
    id: "chest-xray",
    name: "Chest X-ray Analysis",
    href: "/protected/chest-x-ray",
    icon: "/assets/sidebar-icons/chest-xray-icon.svg",
    section: "main",
  },
  {
    id: "ecg-signal",
    name: "ECG Signal Analysis",
    href: "/protected/ecg-signal-analysis",
    icon: "/assets/sidebar-icons/ecg-icon.svg",
    section: "main",
  },
  {
    id: "medical-qa",
    name: "Medical Q&A",
    href: "/protected/medical-qa",
    icon: "/assets/sidebar-icons/medical-qa-icon.svg",
    section: "main",
  },
  {
    id: "symptom-explorer",
    name: "Symptom Explorer",
    href: "/protected/symptom-explorer",
    icon: "/assets/sidebar-icons/clinicals-icon.svg",
    section: "main",
  },
  {
    id: "report-generator",
    name: "Report Generator",
    href: "/protected/report-generator",
    icon: "/assets/sidebar-icons/documentation-icon.svg",
    section: "main",
  },
];

export const settingsHelpNavigationItems: NavigationItem[] = [
  {
    id: "support",
    name: "Support",
    href: "/protected/doctors/support",
    icon: "/assets/sidebar-icons/support-icon.svg",
    section: "help",
  },
  {
    id: "settings",
    name: "Settings",
    href: "/protected/doctors/settings",
    icon: "/assets/sidebar-icons/settings-icon.svg",
    section: "settings",
  },
  {
    id: "documentation",
    name: "Documentation",
    href: "/protected/doctors/documentation",
    icon: "/assets/sidebar-icons/documentation-icon.svg",
    section: "help",
  },
];

export const logoutNavigationItem: NavigationItem = {
  id: "logout",
  name: "Logout",
  href: "/auth/login",
  icon: "/assets/sidebar-icons/logout-icon.svg",
  section: "help",
};

export const allNavigationItems = [
  ...mainNavigationItems,
  ...clinicalToolsSidebarItems,
  ...settingsHelpNavigationItems,
  logoutNavigationItem,
];

