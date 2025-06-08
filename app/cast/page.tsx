"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import Header from "../components/ui/Header";
import Tweets from "../components/cast/Tweets";
import { ConnectNeynar } from "../components/cast/ConnectNeynar";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useCurrentUser } from "@/hooks/useUsers";

export default function CastPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { data: userData } = useCurrentUser();
  const [showConnectNeynar, setShowConnectNeynar] = useState(false);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Check for neynar signer uuid and show modal if not present
  useEffect(() => {
    if (userData && !userData.user?.neynar_signer_uuid) {
      setShowConnectNeynar(true);
    }
  }, [userData]);

  const handleConnectNeynarClose = () => {
    setShowConnectNeynar(false);
  };

  return (
    <div>
      <Header title="Pick and Cast" />
      <div className="flex flex-col gap-5 mt-4 h-[calc(100dvh-164px)] px-5 pb-5">
        <Tweets fid={context?.user?.fid ?? 3} />
      </div>
      <Navbar />
      <ConnectNeynar
        isOpen={showConnectNeynar}
        onClose={handleConnectNeynarClose}
      />
    </div>
  );
}
