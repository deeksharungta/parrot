"use client";

import React, { useEffect } from "react";
import Header from "../components/ui/Header";
import YoloMode from "../components/settings/YoloMode";
import DisconnectNeynar from "../components/settings/DisconnectNeynar";
import Navbar from "../components/ui/Navbar";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { analytics } from "@/lib/analytics";
import XUsername from "../components/settings/XUsername";

export default function SettingsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const queryClient = useQueryClient();

  // Track page view
  useEffect(() => {
    analytics.trackPageView("settings");
  }, []);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Auto-refresh when user returns to the settings page (e.g., from auth)
  // Removed broad query invalidation to prevent excessive API calls

  const settingsItems = [
    { component: YoloMode, delay: 0.3 },
    { component: XUsername, delay: 0.4 },
    { component: DisconnectNeynar, delay: 0.5 },
  ];

  return (
    <div>
      <Header title="Settings" />
      <motion.div
        className="flex flex-col gap-5 mt-4 h-[calc(100dvh-170px)] px-5 pb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {settingsItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: item.delay }}
          >
            <item.component />
          </motion.div>
        ))}
      </motion.div>
      <Navbar />
    </div>
  );
}
