"use client";

import React, { useEffect, useState } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";
import { sdk } from "@farcaster/frame-sdk";
import { analytics } from "@/lib/analytics";
import LandingPage from "./components/landing-page/LandingPage";
import Image from "next/image";

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [sdkReady, setSdkReady] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  // Track page view - only once on mount
  useEffect(() => {
    if (isMiniApp !== null) {
      analytics.trackPageView("home", {
        is_mini_app: isMiniApp,
        user_fid: context?.user?.fid,
      });
    } else {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Check if running in a Mini App
        const miniAppStatus = await sdk.isInMiniApp();

        setIsMiniApp(miniAppStatus);

        if (miniAppStatus) {
          // Wait for the SDK context to be available
          if (sdk.context) {
            await sdk.context;
            await sdk.actions.ready();
            setSdkReady(true);
          } else {
            setSdkReady(true);
          }
        } else {
          setSdkReady(true);
        }
      } catch (error) {
        console.error("[HomePage] Failed to initialize Farcaster SDK:", error);
        // Even if SDK fails, we should still set it as ready to not block the UI
        setSdkReady(true);
        setIsMiniApp(false);
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    if (!isFrameReady && isMiniApp) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady, isMiniApp]);

  useEffect(() => {
    if (isMiniApp && sdkReady && context?.client && !context.client.added) {
      sdk.actions.addMiniApp().catch((error) => {
        console.error("[HomePage] Failed to add mini app:", error);
      });
    }
  }, [context?.client?.added, sdkReady, isMiniApp, context]);

  // Show loading state while we determine the app type
  if (isMiniApp === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMiniApp ? (
        // Mini App version - show the full app
        <motion.div
          className="flex flex-col items-center justify-start h-screen overflow-hidden relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/landing/header-bg.svg"
            alt="Navbar Background"
            fill
            className="object-cover object-top"
            unoptimized
          />
          <WelcomeCard />
          <UserProfiles />
        </motion.div>
      ) : (
        // Web version - show open mini app prompt
        <LandingPage />
      )}
    </>
  );
}
