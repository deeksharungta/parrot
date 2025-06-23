import posthog from "posthog-js";

export const initPostHog = () => {
  if (typeof window !== "undefined") {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only", // or 'always' to create profiles for anonymous users
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            console.log("PostHog loaded successfully");
          }
        },
        capture_pageview: false, // Disable automatic pageview capture, we'll capture manually
        capture_pageleave: true, // Capture when user leaves
        session_recording: {
          // Enable session recordings (optional)
          recordCrossOriginIframes: true,
        },
      });
    } else {
      console.warn("PostHog key not found in environment variables");
    }
  }
};

export { posthog };
