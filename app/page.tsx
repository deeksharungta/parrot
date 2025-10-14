"use client";

import React, { useEffect, useState } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";
import { sdk } from "@farcaster/miniapp-sdk";
import { analytics } from "@/lib/analytics";
import LandingPage from "./components/landing-page/LandingPage";

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();

  useEffect(() => {
    // Call ready immediately as suggested in the docs
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    if (context?.client && !context.client.added) {
      sdk.actions.addMiniApp().catch((error) => {
        console.error("Failed to add mini app:", error);
      });
    }
  }, [context?.client.added]);

  return (
    <motion.div
      className="flex flex-col items-center justify-start h-screen overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WelcomeCard />
      <UserProfiles />
    </motion.div>
  );
}
