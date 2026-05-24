"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  mainNavigationItems,
  clinicalToolsSidebarItems,
  settingsHelpNavigationItems,
} from "@/lib/sidebar-navigation";

export function Sidebar({ className }: { className?: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Auto-collapse on resize
  useEffect(() => {
    const handleResize = () => {
      const shouldCollapse = window.innerWidth < 1080;
      setIsCollapsed(shouldCollapse);
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user data
  useEffect(() => {
    const getCurrentUserEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };

    const getCurrentUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          `Dr. ${user.email?.split("@")[0] || "User"}`;
        setUserName(name);
      }
    };

    getCurrentUserEmail();
    getCurrentUserName();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/protected/doctors") {
      return pathname === "/protected/doctors";
    }
    return pathname.startsWith(href);
  };

  const renderNavigationItem = (
    item: typeof mainNavigationItems[0],
    isSettingsHelp = false
  ) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.name}
        href={item.href}
        title={isCollapsed ? item.name : undefined}
      >
        <div
          className={cn(
            "flex items-center px-2 rounded-[8px] transition-all h-[24px]",
            isCollapsed ? "justify-center gap-0" : "gap-1.5",
            active
              ? "bg-[linear-gradient(180deg,rgba(255,168,200,1)_7%,rgba(245,137,71,1)_70%,rgba(244,115,37,1)_88%,rgba(255,79,52,1)_100%)] shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01),0px_35.53px_10.01px_0px_rgba(0,0,0,0)]"
              : "hover:bg-gray-200/50 dark:hover:bg-white/5"
          )}
          style={
            active
              ? {
                  boxShadow:
                    "0px 1.43px 3.06px 0px rgba(0,0,0,0.04), 0px 5.72px 5.72px 0px rgba(0,0,0,0.03), 0px 12.87px 7.76px 0px rgba(0,0,0,0.02), 0px 22.67px 9.19px 0px rgba(0,0,0,0.01), 0px 35.53px 10.01px 0px rgba(0,0,0,0), inset 0px 0px 8.4px 4.2px rgba(255,255,255,0.4), inset 0px 4px 3px 0px rgba(255,255,255,0.28)",
                }
              : undefined
          }
        >
          <div className="w-[12px] h-[12px] relative flex-shrink-0">
            <Image
              src={item.icon}
              alt={item.name}
              width={12}
              height={12}
              className={cn(
                "object-contain dark:invert dark:brightness-[2]",
                active ? "brightness-0 invert dark:invert-0 dark:brightness-100" : ""
              )}
              style={
                !active
                  ? {
                      filter: isSettingsHelp
                        ? "invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%)"
                        : "invert(32%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%)",
                    }
                  : {}
              }
            />
          </div>
          {!isCollapsed && (
            <span
              className={cn(
                "text-[13px] font-normal leading-[1.15]",
                active
                  ? "text-white"
                  : isSettingsHelp
                    ? "text-[#202020] dark:text-neutral-200"
                    : "text-[#525252] dark:text-neutral-300"
              )}
              style={{ letterSpacing: "0.5%" }}
            >
              {item.name}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "bg-[#F8F8F8] dark:bg-[hsl(var(--surface-panel))] rounded-[24px] flex flex-col px-4 py-[10px] h-full transition-all duration-300 overflow-hidden relative",
        isCollapsed ? "w-20" : "w-[260px]",
        className
      )}
    >
      {/* Logo Header Section - Fixed at top */}
      <div className="flex items-center justify-between mb-[29px] flex-shrink-0 gap-2">
        {!isCollapsed && (
          <span className="text-xl font-semibold text-[#212121] dark:text-white">
            Neuro medica
          </span>
        )}
        <div className={cn("flex items-center gap-1", isCollapsed && "flex-col-reverse")}>
          {/* Theme toggle */}
          <ThemeToggle
            className="w-6 h-6"
            size={14}
          />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Image
              src="/assets/icons/Vector (1).svg"
              alt="Menu"
              width={13}
              height={13}
              className="object-contain dark:invert dark:brightness-[2]"
            />
          </button>
        </div>
      </div>

      {/* Navigation Area - Flex-1, scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Main Navigation */}
        <nav className="space-y-[2px] mb-3">
          {mainNavigationItems.map((item) => renderNavigationItem(item))}
        </nav>

        {!isCollapsed && (
          <p
            className="text-[11px] text-[#838383] dark:text-neutral-400 mb-1 px-2 leading-[1.15]"
            style={{ letterSpacing: "0.5%" }}
          >
            Clinical tools
          </p>
        )}
        <nav className="space-y-[2px] mb-3">
          {clinicalToolsSidebarItems.map((item) => renderNavigationItem(item))}
        </nav>

        {/* Settings & Help Section */}
        {!isCollapsed && (
          <p
            className="text-[11px] text-[#838383] dark:text-neutral-400 mb-1 px-2 leading-[1.15]"
            style={{ letterSpacing: "0.5%" }}
          >
            Settings & help
          </p>
        )}
        <nav className="space-y-[2px] mb-3">
          {settingsHelpNavigationItems.map((item) =>
            renderNavigationItem(item, true)
          )}
        </nav>
      </div>

      {/* Gradient Background Image */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden rounded-b-[24px] opacity-100 dark:opacity-30">
        <Image
          src="/assets/icons/Group 1244832313.svg"
          alt=""
          width={276}
          height={429}
          className="w-full h-auto object-cover object-bottom"
          style={{ mixBlendMode: "normal" }}
        />
      </div>

      {/* AI Predictive Alert Cards */}
      {!isCollapsed && (
        <div className="mb-3 relative h-[120px] z-20 flex-shrink-0">
          {/* Bottom Layer */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[180px] h-[120px] bg-white dark:bg-[hsl(var(--surface-card))] border-[0.85px] border-[#EDEDED] dark:border-white/10 rounded-[10px] opacity-50 shadow-sm">
            <div className="left-3 top-3 w-[154px]"></div>
          </div>

          {/* Middle Layer */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[7px] w-[200px] h-[120px] bg-white dark:bg-[hsl(var(--surface-card))] border-[0.85px] border-[#EDEDED] dark:border-white/10 rounded-[10px] opacity-50 shadow-sm">
            <div className="left-3 top-3 w-[174px]"></div>
          </div>

          {/* Top Layer */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-white dark:bg-[hsl(var(--surface-card))] border-[0.85px] border-[#EDEDED] dark:border-white/10 rounded-[10px] p-3 w-[220px] h-[120px] shadow-md">
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 relative flex-shrink-0">
                  <Image
                    src="/assets/icons/message-heart-circle.png"
                    alt="AI Alert"
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                </div>
                <span className="text-[11px] font-medium text-[#E2AB02] leading-none">
                  AI Predictive Alert
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-[#070707] dark:text-neutral-100 leading-[1.3]">
                  Fatigue risk predicted for John.
                </p>
                <p className="text-[10px] font-normal text-[#767676] dark:text-neutral-400 leading-[1.3]">
                  Blood sugar levels are 15% higher than usual this week,
                  increasing the likelihood of fatigue in the next 2 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Line Separator */}
      {!isCollapsed && (
        <div className="mb-3 w-full h-[2px] bg-white dark:bg-white/10 relative z-10 flex-shrink-0" />
      )}

      {/* User Profile Section - Anchored to bottom */}
      <div
        className={cn(
          "flex items-center pb-1 relative z-10 flex-shrink-0",
          isCollapsed ? "justify-center flex-col gap-2" : "gap-2.5"
        )}
      >
        <div className="w-9 h-9 relative rounded-[10px] bg-white dark:bg-[hsl(var(--surface-card))] overflow-hidden flex-shrink-0">
          <Image
            src="/assets/icons/Memoji Boys 2-21.png"
            alt="User Avatar"
            width={36}
            height={36}
            className="object-cover"
          />
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold text-[#202020] dark:text-neutral-100 truncate leading-[1.15]"
                style={{ letterSpacing: "0.5%" }}
                title={userName || "Super Admin"}
              >
                {userName || "Super Admin"}
              </p>
              <p
                className="text-[11px] font-normal text-[#202020] dark:text-neutral-400 truncate leading-[1.15]"
                style={{ letterSpacing: "0.5%" }}
                title={userEmail || ""}
              >
                {userEmail || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-5 h-5 flex-shrink-0 hover:opacity-70 transition-opacity"
              title="Logout"
            >
              <Image
                src="/assets/sidebar-icons/logout-icon.svg"
                alt="Logout"
                width={20}
                height={20}
                className="object-contain dark:invert dark:brightness-[2]"
              />
            </button>
          </>
        )}
        {isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-5 h-5 flex-shrink-0 hover:opacity-70 transition-opacity"
            title="Logout"
          >
            <Image
              src="/assets/sidebar-icons/logout-icon.svg"
              alt="Logout"
              width={20}
              height={20}
              className="object-contain dark:invert dark:brightness-[2]"
            />
          </button>
        )}
      </div>
    </div>
  );
}
