"use client";

import React, { useEffect, useState } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";
import { sdk } from "@farcaster/frame-sdk";
import { analytics } from "@/lib/analytics";

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [sdkReady, setSdkReady] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  // Track page view
  useEffect(() => {
    analytics.trackPageView("home", {
      is_mini_app: isMiniApp,
      user_fid: context?.user?.fid,
    });
  }, [isMiniApp, context?.user?.fid]);

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
            // Call ready to indicate the app is fully loaded
            await sdk.actions.ready();
            setSdkReady(true);
          }
        } else {
          setSdkReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
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
        console.error("Failed to add mini app:", error);
      });
    }
  }, [context?.client.added, sdkReady, isMiniApp]);

  // Show loading state while we determine the app type
  if (isMiniApp === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-start h-screen overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isMiniApp ? (
        // Mini App version - show the full app
        <>
          <WelcomeCard />
          <UserProfiles />
        </>
      ) : (
        // Web version - show open mini app prompt
        <div className="flex flex-col items-center justify-center space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Open in Farcaster
            </h1>
            <p className="text-gray-600 mb-8">
              This app works best as a Mini App in Farcaster
            </p>
            <button
              onClick={() => {
                // You can add logic here to redirect to Farcaster or show instructions
                window.open(
                  "https://farcaster.xyz/miniapps/wttQ9mMjERiS/parrot",
                  "_blank",
                );
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Open Mini App
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
