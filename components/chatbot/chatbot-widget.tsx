"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChatWindowMini } from "./chat-window-mini";
import { ChatbotPreviewWidget } from "./chatbot-preview-widget";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export function ChatbotWidget() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  // Wait until we know the auth state, then render for everyone: signed-in
  // users get the full assistant, logged-out visitors get a product-info
  // assistant that gates clinical questions behind sign-in.
  if (isChecking) {
    return null;
  }

  if (pathname === "/protected/chat") {
    return null;
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <ChatbotPreviewWidget onExpand={handleExpand} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-40 w-[380px]"
          >
            <div className="bg-white dark:bg-[hsl(var(--surface-card))] rounded-t-2xl shadow-2xl border border-gray-200 dark:border-white/10 h-[600px] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
              <ChatWindowMini onClose={handleClose} isAuthenticated={isAuthenticated} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
