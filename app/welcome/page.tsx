"use client";

import React, { useEffect } from "react";
import WelcomeCard from "../components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "../components/welcome/UserProfiles";

export default function WelcomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <div className="flex flex-col items-center justify-start h-screen overflow-hidden relative">
      <WelcomeCard />
      <UserProfiles />
    </div>
  );
}
