"use client";

import { useCallback } from "react";
import { sentry } from "@/lib/sentry";
import { analytics } from "@/lib/analytics";

export const useSentry = () => {
  // Unified error tracking (both Sentry and PostHog)
  const trackError = useCallback(
    (error: Error, context?: string, properties?: Record<string, any>) => {
      analytics.trackError(error, context, properties);
    },
    [],
  );

  // Track API errors
  const trackApiError = useCallback(
    (error: Error, endpoint: string, method: string, statusCode?: number) => {
      analytics.trackApiError(error, endpoint, method, statusCode);
    },
    [],
  );

  // Track authentication errors
  const trackAuthError = useCallback(
    (error: Error, action: string, userId?: string) => {
      analytics.trackAuthError(error, action, userId);
    },
    [],
  );

  // Track cast/tweet errors
  const trackCastError = useCallback(
    (error: Error, tweetId: string, action: string) => {
      analytics.trackCastError(error, tweetId, action);
    },
    [],
  );

  // Track payment errors
  const trackPaymentError = useCallback(
    (error: Error, amount: number, action: string) => {
      analytics.trackPaymentError(error, amount, action);
    },
    [],
  );

  // Add breadcrumb for debugging context
  const addBreadcrumb = useCallback(
    (message: string, category?: string, data?: Record<string, any>) => {
      sentry.addBreadcrumb(message, category, data);
    },
    [],
  );

  // Set user context
  const setUser = useCallback(
    (user: {
      id: string;
      username?: string;
      email?: string;
      fid?: number;
      [key: string]: any;
    }) => {
      sentry.setUser(user);
    },
    [],
  );

  // Set tag for filtering errors
  const setTag = useCallback((key: string, value: string) => {
    sentry.setTag(key, value);
  }, []);

  // Wrap async operations with performance monitoring
  const withPerformance = useCallback(
    (name: string, operation: string, callback: () => Promise<any>) => {
      return sentry.withPerformance(name, operation, callback);
    },
    [],
  );

  return {
    trackError,
    trackApiError,
    trackAuthError,
    trackCastError,
    trackPaymentError,
    addBreadcrumb,
    setUser,
    setTag,
    withPerformance,
  };
};
