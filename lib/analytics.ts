import { posthog } from "./posthog";

// Event names - keep these consistent across your app
export const EVENTS = {
  // Authentication events
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",

  // Tweet/Cast events
  TWEET_CREATED: "tweet_created",
  TWEET_EDITED: "tweet_edited",
  TWEET_DELETED: "tweet_deleted",
  TWEET_APPROVED: "tweet_approved",
  TWEET_REJECTED: "tweet_rejected",
  CAST_CREATED: "cast_created",
  CAST_THREAD_CREATED: "cast_thread_created",

  // User interaction events
  PAGE_VIEWED: "page_viewed",
  BUTTON_CLICKED: "button_clicked",
  MODAL_OPENED: "modal_opened",
  MODAL_CLOSED: "modal_closed",

  // Neynar/Farcaster events
  NEYNAR_CONNECTED: "neynar_connected",
  NEYNAR_DISCONNECTED: "neynar_disconnected",

  // USDC/Payment events
  USDC_APPROVAL_REQUESTED: "usdc_approval_requested",
  USDC_APPROVAL_COMPLETED: "usdc_approval_completed",
  SPENDING_APPROVED: "spending_approved",

  // Settings events
  NOTIFICATIONS_TOGGLED: "notifications_toggled",
  YOLO_MODE_TOGGLED: "yolo_mode_toggled",

  // Error events
  ERROR_OCCURRED: "error_occurred",
} as const;

// Analytics tracking functions
export const analytics = {
  // Generic event tracking
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  },

  // Track page views
  trackPageView: (page: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(EVENTS.PAGE_VIEWED, {
        page,
        ...properties,
      });
    }
  },

  // Track user authentication
  trackSignIn: (method: string, userId?: string) => {
    if (posthog) {
      posthog.capture(EVENTS.USER_SIGNED_IN, {
        method,
        user_id: userId,
      });
    }
  },

  trackSignOut: (userId?: string) => {
    if (posthog) {
      posthog.capture(EVENTS.USER_SIGNED_OUT, {
        user_id: userId,
      });
    }
  },

  // Track tweet/cast actions
  trackTweetCreated: (tweetData: {
    length: number;
    hasMedia: boolean;
    hasHashtags: boolean;
    hasMentions: boolean;
  }) => {
    if (posthog) {
      posthog.capture(EVENTS.TWEET_CREATED, tweetData);
    }
  },

  trackTweetEdited: (editData: {
    originalLength: number;
    newLength: number;
    changeType: "shortened" | "lengthened" | "modified";
  }) => {
    if (posthog) {
      posthog.capture(EVENTS.TWEET_EDITED, editData);
    }
  },

  trackCastCreated: (castData: {
    length: number;
    hasMedia: boolean;
    isThread: boolean;
    threadLength?: number;
  }) => {
    if (posthog) {
      posthog.capture(EVENTS.CAST_CREATED, castData);
    }
  },

  // Track user interactions
  trackButtonClick: (
    buttonName: string,
    location: string,
    properties?: Record<string, any>,
  ) => {
    if (posthog) {
      posthog.capture(EVENTS.BUTTON_CLICKED, {
        button_name: buttonName,
        location,
        ...properties,
      });
    }
  },

  trackModalOpen: (modalName: string, trigger: string) => {
    if (posthog) {
      posthog.capture(EVENTS.MODAL_OPENED, {
        modal_name: modalName,
        trigger,
      });
    }
  },

  trackModalClose: (
    modalName: string,
    action: "close" | "cancel" | "complete",
  ) => {
    if (posthog) {
      posthog.capture(EVENTS.MODAL_CLOSED, {
        modal_name: modalName,
        close_action: action,
      });
    }
  },

  // Track Neynar/Farcaster connections
  trackNeynarConnect: (userId: string, fid?: number) => {
    if (posthog) {
      posthog.capture(EVENTS.NEYNAR_CONNECTED, {
        user_id: userId,
        fid,
      });
    }
  },

  trackNeynarDisconnect: (userId: string) => {
    if (posthog) {
      posthog.capture(EVENTS.NEYNAR_DISCONNECTED, {
        user_id: userId,
      });
    }
  },

  // Track USDC/Payment events
  trackUSDCApproval: (
    amount: number,
    status: "requested" | "completed" | "failed",
  ) => {
    if (posthog) {
      posthog.capture(
        status === "requested"
          ? EVENTS.USDC_APPROVAL_REQUESTED
          : EVENTS.USDC_APPROVAL_COMPLETED,
        {
          amount,
          status,
        },
      );
    }
  },

  // Track settings changes
  trackNotificationsToggle: (enabled: boolean) => {
    if (posthog) {
      posthog.capture(EVENTS.NOTIFICATIONS_TOGGLED, {
        enabled,
      });
    }
  },

  trackYoloModeToggle: (enabled: boolean) => {
    if (posthog) {
      posthog.capture(EVENTS.YOLO_MODE_TOGGLED, {
        enabled,
      });
    }
  },

  // Track errors
  trackError: (
    error: Error,
    context?: string,
    properties?: Record<string, any>,
  ) => {
    if (posthog) {
      posthog.capture(EVENTS.ERROR_OCCURRED, {
        error_message: error.message,
        error_stack: error.stack,
        context,
        ...properties,
      });
    }
  },

  // Identify user with properties
  identifyUser: (userId: string, userProperties: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, {
        ...userProperties,
        identified_at: new Date().toISOString(),
      });
    }
  },
};
