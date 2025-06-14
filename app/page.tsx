"use client";

import React, { useEffect, useState } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";
import { sdk } from "@farcaster/frame-sdk";

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Wait for the SDK context to be available
        if (sdk.context) {
          await sdk.context;
          // Call ready to indicate the app is fully loaded
          await sdk.actions.ready();
          setSdkReady(true);
          console.log("Farcaster SDK initialized successfully");
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
        // Even if SDK fails, we should still set it as ready to not block the UI
        setSdkReady(true);
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    if (sdkReady && context?.client && !context.client.added) {
      sdk.actions.addMiniApp().catch((error) => {
        console.error("Failed to add mini app:", error);
      });
    }
  }, [context?.client.added, sdkReady]);

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
