"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";

function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Hello World</h1>
        <p className="text-lg text-gray-600">Your Mini App is working!</p>
      </div>
    </div>
  );
}

export default App;
