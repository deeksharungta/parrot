"use client";

import React, { useEffect } from "react";
import Navbar from "../components/ui/Navbar";
import Header from "../components/ui/Header";
import Tweets from "../components/cast/Tweets";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function CastPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <div className="p-5">
      <Header title="Pick and Cast" />
      <div className="flex flex-col gap-5 mt-9 h-[calc(100dvh-200px)]">
        <Tweets />
      </div>
      <Navbar />
    </div>
  );
}
