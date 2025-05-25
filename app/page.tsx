"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
import React, { useEffect } from "react";

export default function HomePage() {
  const openUrl = useOpenUrl();
  const { setFrameReady, isFrameReady } = useMiniKit();
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <button onClick={() => openUrl("https://xcast-sepia.vercel.app/auth")}>
      Visit Website
    </button>
  );
}
