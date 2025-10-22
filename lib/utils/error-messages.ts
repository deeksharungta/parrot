/**
 * Sanitizes error messages to prevent exposing internal/technical details to users
 * Converts technical error messages into user-friendly ones
 */
export function sanitizeErrorMessage(error: string | undefined): string {
  if (!error) {
    return "Something went wrong, please reload the app and try again";
  }

  const errorLower = error.toLowerCase();

  // Map of technical error patterns to user-friendly messages
  const errorMappings: Array<{ pattern: RegExp | string; message: string }> = [
    // Authentication/token errors - suggest reload
    {
      pattern:
        /authentication required|token|jwt|session|unauthorized|401|forbidden|403/i,
      message: "Session expired, please reload the app and try again",
    },

    // Database errors
    {
      pattern: /database|sql|query|supabase/i,
      message: "Something went wrong, please reload the app and try again",
    },

    // API configuration errors
    {
      pattern: /api key|not configured|missing key/i,
      message: "Service unavailable, please reload the app and try again",
    },
    {
      pattern: /private key|payment system/i,
      message: "Service unavailable, please reload the app and try again",
    },

    // Network errors
    {
      pattern: /network|fetch failed|connection/i,
      message: "Connection issue, please reload the app and try again",
    },
    {
      pattern: /timeout/i,
      message: "Request timed out, please reload the app and try again",
    },

    // Neynar/Farcaster specific
    {
      pattern: /neynar|farcaster cast/i,
      message: "Unable to post cast, please reload the app and try again",
    },
    {
      pattern: /signer/i,
      message: "Connection failed, please reload the app and try again",
    },

    // Payment errors
    {
      pattern: /usdc|payment|allowance|balance/i,
      message: "Payment failed, please reload the app and try again",
    },

    // User/account errors
    {
      pattern: /user not found|user not registered/i,
      message: "Account not found, please reload the app and try again",
    },
    {
      pattern:
        /failed to save user|failed to update user|failed to create user/i,
      message: "Unable to save, please reload the app and try again",
    },

    // Tweet/content errors
    {
      pattern: /tweet not found/i,
      message: "Tweet unavailable",
    },
    {
      pattern: /failed to save|failed to update/i,
      message: "Unable to save, please reload the app and try again",
    },
    {
      pattern: /failed to fetch/i,
      message: "Unable to load, please reload the app and try again",
    },

    // Generic internal errors
    {
      pattern: /internal server error|500/i,
      message: "Something went wrong, please reload the app and try again",
    },
    {
      pattern: /failed to|error/i,
      message: "Action failed, please reload the app and try again",
    },
  ];

  // Check each pattern and return user-friendly message
  for (const { pattern, message } of errorMappings) {
    if (typeof pattern === "string") {
      if (errorLower.includes(pattern.toLowerCase())) {
        return message;
      }
    } else {
      if (pattern.test(error)) {
        return message;
      }
    }
  }

  // If error message seems user-friendly already (short and doesn't contain technical terms)
  const technicalTerms = [
    "error:",
    "exception",
    "stack",
    "null",
    "undefined",
    "object",
    "function",
    "api",
    "endpoint",
    "response",
    "status code",
  ];

  const hasTechnicalTerms = technicalTerms.some((term) =>
    errorLower.includes(term),
  );

  if (!hasTechnicalTerms && error.length < 100) {
    return error;
  }

  // Default fallback
  return "Something went wrong, please reload the app and try again";
}
