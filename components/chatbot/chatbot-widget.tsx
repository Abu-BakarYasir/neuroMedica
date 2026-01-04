"use client";

import { useState, useEffect } from "react";
import { ChatWindow } from "./chat-window";
import { ChatbotPreviewWidget } from "./chatbot-preview-widget";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export function ChatbotWidget() {
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

  if (isChecking || !isAuthenticated) {
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
      {/* Compact Preview Widget - Only visible when chat panel is collapsed */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <ChatbotPreviewWidget
              onExpand={handleExpand}
              isExpanded={isExpanded}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-40 w-[380px]"
          >
            <div className="bg-white rounded-t-2xl shadow-2xl border border-gray-200 h-[600px] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
              <ChatWindow
                showInput={true}
                onClose={handleClose}
                showExpandButton={false}
                showCloseButton={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
