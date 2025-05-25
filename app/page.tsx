"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
import React, { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <button
      onClick={() => sdk.actions.openUrl("https://xcast-sepia.vercel.app/auth")}
    >
      Visit Website
    </button>
  );
}
