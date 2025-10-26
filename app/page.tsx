"use client";

import React, { useEffect, useState } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";
import { sdk } from "@farcaster/frame-sdk";
import { analytics } from "@/lib/analytics";
import LandingPage from "./components/landing-page/LandingPage";

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [sdkReady, setSdkReady] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  // Track page view - only once on mount
  useEffect(() => {
    console.log("[HomePage] Page view tracking effect triggered", {
      isMiniApp,
      userFid: context?.user?.fid,
      contextExists: !!context,
    });

    if (isMiniApp !== null) {
      console.log("[HomePage] Tracking page view", {
        page: "home",
        is_mini_app: isMiniApp,
        user_fid: context?.user?.fid,
      });

      analytics.trackPageView("home", {
        is_mini_app: isMiniApp,
        user_fid: context?.user?.fid,
      });
    } else {
      console.log("[HomePage] Skipping page view tracking - isMiniApp is null");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("[HomePage] SDK initialization effect triggered");

    const initializeSDK = async () => {
      console.log("[HomePage] Starting SDK initialization");

      try {
        // Check if running in a Mini App
        console.log("[HomePage] Checking if running in Mini App...");
        const miniAppStatus = await sdk.isInMiniApp();
        console.log("[HomePage] Mini App status:", miniAppStatus);

        setIsMiniApp(miniAppStatus);

        if (miniAppStatus) {
          console.log(
            "[HomePage] Running in Mini App - initializing SDK context",
          );

          // Wait for the SDK context to be available
          if (sdk.context) {
            console.log("[HomePage] SDK context exists, waiting for it...");
            await sdk.context;
            console.log("[HomePage] SDK context ready");

            // Call ready to indicate the app is fully loaded
            console.log("[HomePage] Calling SDK ready action");
            await sdk.actions.ready();
            console.log("[HomePage] SDK ready action completed");

            setSdkReady(true);
            console.log("[HomePage] SDK initialization completed successfully");
          } else {
            console.log("[HomePage] SDK context not available");
            setSdkReady(true);
          }
        } else {
          console.log(
            "[HomePage] Not running in Mini App - setting SDK as ready",
          );
          setSdkReady(true);
        }
      } catch (error) {
        console.error("[HomePage] Failed to initialize Farcaster SDK:", error);
        // Even if SDK fails, we should still set it as ready to not block the UI
        setSdkReady(true);
        setIsMiniApp(false);
        console.log(
          "[HomePage] SDK initialization failed, but continuing with fallback",
        );
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    debugger;
    console.log("[HomePage] Frame ready effect triggered", {
      isFrameReady,
      isMiniApp,
      shouldSetFrameReady: !isFrameReady && isMiniApp,
    });

    if (!isFrameReady && isMiniApp) {
      console.log("[HomePage] Setting frame ready");
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady, isMiniApp]);

  useEffect(() => {
    console.log("[HomePage] Add Mini App effect triggered", {
      isMiniApp,
      sdkReady,
      hasContext: !!context,
      hasClient: !!context?.client,
      clientAdded: context?.client?.added,
      shouldAddMiniApp:
        isMiniApp && sdkReady && context?.client && !context.client.added,
    });

    if (isMiniApp && sdkReady && context?.client && !context.client.added) {
      console.log("[HomePage] Adding Mini App to client");
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
