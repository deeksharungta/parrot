"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

export function PostHogSimpleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== "undefined") {
      initPostHog();
    }
  }, []);

  return <>{children}</>;
}
