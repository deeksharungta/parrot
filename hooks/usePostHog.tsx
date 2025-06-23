import { useEffect } from "react";
import { posthog } from "@/lib/posthog";

export const usePostHog = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const identifyUser = (
    userId: string,
    userProperties?: Record<string, any>,
  ) => {
    if (posthog) {
      posthog.identify(userId, userProperties);
    }
  };

  const setUserProperties = (properties: Record<string, any>) => {
    if (posthog) {
      posthog.setPersonProperties(properties);
    }
  };

  const reset = () => {
    if (posthog) {
      posthog.reset();
    }
  };

  // Feature flags
  const isFeatureEnabled = (flagKey: string) => {
    if (posthog) {
      return posthog.isFeatureEnabled(flagKey);
    }
    return false;
  };

  const getFeatureFlag = (flagKey: string) => {
    if (posthog) {
      return posthog.getFeatureFlag(flagKey);
    }
    return undefined;
  };

  return {
    trackEvent,
    identifyUser,
    setUserProperties,
    reset,
    isFeatureEnabled,
    getFeatureFlag,
    posthog, // Direct access if needed
  };
};
