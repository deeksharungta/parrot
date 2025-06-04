"use client";
import React, { useEffect } from "react";
import Header from "../components/ui/Header";
import YoloMode from "../components/settings/YoloMode";
import DisconnectNeynar from "../components/settings/DisconnectNeynar";
import Notifications from "../components/settings/Notifications";
import Navbar from "../components/ui/Navbar";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function SettingsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <div>
      <Header title="Settings" />
      <div className="flex flex-col gap-5 mt-4 h-[calc(100dvh-164px)] px-5 pb-5">
        <YoloMode />
        <DisconnectNeynar />
        <Notifications />
      </div>
      <Navbar />
    </div>
  );
}
