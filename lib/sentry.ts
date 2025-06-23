import * as Sentry from "@sentry/nextjs";

// Sentry utility functions
export const sentry = {
  // Capture exceptions with context
  captureException: (error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("additional_info", context);
      }
      Sentry.captureException(error);
    });
  },

  // Capture messages with severity
  captureMessage: (
    message: string,
    level: Sentry.SeverityLevel = "info",
    context?: Record<string, any>,
  ) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("additional_info", context);
      }
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  },

  // Set user context for error tracking
  setUser: (user: {
    id: string;
    username?: string;
    email?: string;
    fid?: number;
    [key: string]: any;
  }) => {
    Sentry.setUser(user);
  },

  // Add breadcrumb for debugging
  addBreadcrumb: (
    message: string,
    category?: string,
    data?: Record<string, any>,
  ) => {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      data,
      level: "info",
    });
  },

  // Set tag for filtering
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  // Track API errors
  captureApiError: (
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
  ) => {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "api_error");
      scope.setContext("api_details", {
        endpoint,
        method,
        status_code: statusCode,
      });
      Sentry.captureException(error);
    });
  },

  // Track authentication errors
  captureAuthError: (error: Error, action: string, userId?: string) => {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "auth_error");
      scope.setContext("auth_details", {
        action,
        user_id: userId,
      });
      Sentry.captureException(error);
    });
  },

  // Track cast/tweet errors
  captureCastError: (error: Error, tweetId: string, action: string) => {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "cast_error");
      scope.setContext("cast_details", {
        tweet_id: tweetId,
        action,
      });
      Sentry.captureException(error);
    });
  },

  // Track payment/USDC errors
  capturePaymentError: (error: Error, amount: number, action: string) => {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "payment_error");
      scope.setContext("payment_details", {
        amount,
        action,
      });
      Sentry.captureException(error);
    });
  },

  // Performance monitoring with breadcrumbs
  withPerformance: async <T>(
    name: string,
    operation: string,
    callback: () => Promise<T>,
  ): Promise<T> => {
    const startTime = Date.now();

    // Add breadcrumb for performance tracking
    Sentry.addBreadcrumb({
      message: `Starting ${operation}: ${name}`,
      category: "performance",
      level: "info",
      data: { operation, name },
    });

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      Sentry.addBreadcrumb({
        message: `Completed ${operation}: ${name} (${duration}ms)`,
        category: "performance",
        level: "info",
        data: { operation, name, duration, status: "success" },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      Sentry.addBreadcrumb({
        message: `Failed ${operation}: ${name} (${duration}ms)`,
        category: "performance",
        level: "error",
        data: { operation, name, duration, status: "error" },
      });

      throw error;
    }
  },
};
