"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { notificationsContent } from "@/lib/doctor-content";
import { AlertCircle, Info, Bell, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = (typeof notificationsContent.notifications)[number];

function NotificationIcon({
  type,
}: {
  type: "alert" | "info" | "reminder";
}) {
  const iconMap = {
    alert: AlertCircle,
    info: Info,
    reminder: Bell,
  };

  const Icon = iconMap[type] || Info;

  return <Icon className="h-5 w-5" />;
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const badgeStyles = {
    high: "bg-[#DEF8E7] dark:bg-emerald-900/40 text-[#13893A] dark:text-emerald-300",
    medium: "bg-[#FBF6E4] dark:bg-amber-900/40 text-[#DFAD0C] dark:text-amber-300",
    low: "bg-[#F5F5F5] dark:bg-white/10 text-[#6B6C6E] dark:text-neutral-300",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-xs font-normal",
        badgeStyles[priority]
      )}
    >
      {priority}
    </span>
  );
}

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>(
    () => notificationsContent.notifications.map((n) => ({ ...n }))
  );

  const unreadCount = items.filter((n) => n.unread).length;

  const markRead = (id: string) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );

  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((n) => n.id !== id));

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-medium text-[#212121] dark:text-neutral-100">
            {notificationsContent.title}
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-neuro-primary text-white text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-xs font-medium text-neuro-primary hover:underline"
          >
            <Check className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="rounded-[20px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-8 text-center text-sm text-[#8D8D8D] dark:text-neutral-400">
          You&apos;re all caught up — no notifications.
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
        {items.map((notification, index) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => notification.unread && markRead(notification.id)}
            className={notification.unread ? "cursor-pointer" : undefined}
          >
            <Card
              className={cn(
                "rounded-[20px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] p-4 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none",
                notification.unread && "border-neuro-primary/30 bg-[#FFFBFB] dark:bg-[hsl(var(--surface-elevated))]"
              )}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-3">
                  {notification.type === "alert" ? (
                    <div className="relative">
                      <Image
                        src="/assets/icons/message-heart-circle.png"
                        alt="AI Alert"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <NotificationIcon type={notification.type as "alert" | "info" | "reminder"} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#212121] dark:text-neutral-100">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        {notification.unread && (
                          <div className="w-2 h-2 rounded-full bg-neuro-primary"></div>
                        )}
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notification.id);
                          }}
                          className="text-[#BBBBBB] dark:text-neutral-500 hover:text-[#525252] dark:hover:text-neutral-300 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#525252] dark:text-neutral-300 mb-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8D8D8D] dark:text-neutral-400">
                        {notification.time}
                      </span>
                      <PriorityBadge priority={notification.priority as "high" | "medium" | "low"} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      )}
    </section>
  );
}






