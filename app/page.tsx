import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import React from "react";

export default function HomePage() {
  const openUrl = useOpenUrl();

  return (
    <button onClick={() => openUrl("https://xcast-sepia.vercel.app/auth")}>
      Visit Website
    </button>
  );
}
