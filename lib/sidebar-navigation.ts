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
    id: "chatbot",
    name: "Chatbot",
    href: "/chat",
    icon: "/assets/sidebar-icons/chatbot-icon.svg",
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
  ...settingsHelpNavigationItems,
  logoutNavigationItem,
];

