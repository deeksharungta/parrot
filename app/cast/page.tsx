"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import Header from "../components/ui/Header";
import Tweets from "../components/cast/Tweets";
import { ConnectNeynar } from "../components/cast/ConnectNeynar";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useCurrentUser } from "@/hooks/useUsers";
import Onboarding from "../components/welcome/Onboarding";
import { analytics } from "@/lib/analytics";

export default function CastPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { data: userData } = useCurrentUser();
  const [showConnectNeynar, setShowConnectNeynar] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track page view
  useEffect(() => {
    if (context?.user?.fid) {
      analytics.trackPageView("cast", {
        user_fid: context.user.fid,
        has_neynar_signer: !!userData?.user?.neynar_signer_uuid,
        signer_status: userData?.user?.signer_approval_status,
      });
    }
  }, [context?.user?.fid, userData]);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Check localStorage for onboarding status after component mounts
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    setShowOnboarding(!onboardingCompleted);
  }, []);

  // Check for neynar signer uuid and show modal if not present
  useEffect(() => {
    if (
      (userData && !userData.user?.neynar_signer_uuid) ||
      (userData && userData.user?.signer_approval_status !== "approved")
    ) {
      setShowConnectNeynar(true);
    }
  }, [userData]);

  const handleConnectNeynarClose = () => {
    setShowConnectNeynar(false);
  };

  if (!context?.user?.fid) {
    return null;
  }

  return (
    <div>
      <Header title="Pick and Cast" />
      <div className="flex flex-col gap-5 mt-4 h-[calc(100dvh-164px)] px-5 pb-5">
        {showOnboarding ? (
          <Onboarding onContinue={() => setShowOnboarding(false)} />
        ) : (
          <Tweets fid={context?.user?.fid} />
        )}
      </div>
      <Navbar />
      <ConnectNeynar
        isOpen={showConnectNeynar}
        onClose={handleConnectNeynarClose}
      />
    </div>
  );
}
