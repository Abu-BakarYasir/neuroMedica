"use client";

import { type ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      className="flex flex-1 flex-col overflow-hidden relative rounded-3xl h-full"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)",
      }}
    >
      {/* Ripple Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/assets/images/Ripple.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
          backgroundSize: "900px auto",
          zIndex: 0,
        }}
      ></div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

