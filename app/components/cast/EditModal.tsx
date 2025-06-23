import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTweet } from "react-tweet";
import Cross from "../icons/Cross";
import Trash from "../icons/Trash";
import Button from "../ui/Button";
import Image from "next/image";
import { useUserSearch, FarcasterUser } from "@/hooks/useUserSearch";
import UserMentionDropdown from "../ui/UserMentionDropdown";
import { useThreadTweets } from "@/hooks/useThreadTweets";
import {
  convertTwitterMentionsToFarcaster,
  resolveTcoUrls,
} from "@/lib/cast-utils";

interface EditModalProps {
  tweetId: string;
  conversationId?: string; // Add conversation ID for thread support
  onSave: (
    content: string,
    mediaUrls: Array<{ url: string; type: string }>,
    quotedTweetUrl: string | null,
    isRetweetRemoved: boolean,
    videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>,
    threadTweets?: Array<{
      tweetId: string;
      content: string;
      mediaUrls: Array<{ url: string; type: string }>;
      videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
      isRetweetRemoved: boolean;
    }>, // Add thread tweets for saving
  ) => void;
  onClose: () => void;
  isLoading: boolean;
  isOpen: boolean;
  isRetweet?: boolean;
  databaseTweet?: any; // Database tweet data with custom media structure
  // New props for confirmation functionality
  title?: string;
  showConfirmation?: boolean; // Whether this is being used as a confirmation modal
}

// Interface for thread tweet editing state
interface ThreadTweetEditState {
  content: string;
  mediaUrls: Array<{ url: string; type: string }>;
  videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
  quotedTweetUrl: string | null;
  showRetweet: boolean;
  isRetweetRemoved: boolean;
}

const STORAGE_KEY = "hide_cast_confirmation";

// Utility function to handle media URLs consistently
const parseMediaUrls = (
  mediaUrls: any,
  twitterMediaDetails?: any[],
): {
  imageUrls: Array<{ url: string; type: string }>;
  videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
} => {
  let imageUrls: Array<{ url: string; type: string }> = [];
  let videoUrls: Array<{ url: string; bitrate: number; content_type: string }> =
    [];

  if (mediaUrls) {
    if (typeof mediaUrls === "object" && !Array.isArray(mediaUrls)) {
      // New structure with images and videos
      if (mediaUrls.images && Array.isArray(mediaUrls.images)) {
        imageUrls = mediaUrls.images.map((url: string) => ({
          url,
          type: "photo",
        }));
      }
      if (mediaUrls.videos && Array.isArray(mediaUrls.videos)) {
        videoUrls = mediaUrls.videos;
      }
    } else if (Array.isArray(mediaUrls)) {
      // Check if this is the database format: Array<{ type: string; url: string }>
      if (
        mediaUrls.length > 0 &&
        typeof mediaUrls[0] === "object" &&
        mediaUrls[0].type &&
        mediaUrls[0].url
      ) {
        // Database format: Array<{ type: string; url: string }>
        mediaUrls.forEach((item: any) => {
          if (
            item.type === "photo" ||
            item.type === "image" ||
            item.type === "gif"
          ) {
            imageUrls.push({ url: item.url, type: item.type });
          } else if (item.type === "video") {
            // For videos from database, we don't have bitrate/content_type, so use defaults
            videoUrls.push({
              url: item.url,
              bitrate: 0, // Default bitrate
              content_type: "video/mp4", // Default content type
            });
          }
        });
      } else {
        // Old structure - assume they're all images (array of strings)
        imageUrls = mediaUrls
          .filter((url: any) => typeof url === "string")
          .map((url: string) => ({ url, type: "photo" }));
        videoUrls = [];
      }
    }
  } else if (twitterMediaDetails) {
    // Twitter API data
    imageUrls =
      twitterMediaDetails.map((media: any) => ({
        url: media.media_url_https,
        type: "photo",
      })) || [];
    videoUrls = [];
  }
  return { imageUrls, videoUrls };
};

export function EditModal({
  tweetId,
  conversationId,
  onSave,
  onClose,
  isLoading,
  isOpen,
  isRetweet = false,
  databaseTweet,
  title = "Edit cast",
  showConfirmation = false,
}: EditModalProps) {
  const { data: tweetData } = useTweet(tweetId);

  // Thread data
  const { threadTweets, isLoading: threadLoading } = useThreadTweets(
    conversationId || null,
    !!conversationId && isOpen,
  );

  // Single tweet state (for non-thread tweets or first tweet)
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState(""); // Track original content
  const [contentWasEdited, setContentWasEdited] = useState(false); // Track if content was manually edited
  const [mediaUrls, setMediaUrls] = useState<
    Array<{ url: string; type: string }>
  >([]);
  const [videoUrls, setVideoUrls] = useState<
    Array<{ url: string; bitrate: number; content_type: string }>
  >([]);
  const [quotedTweetUrl, setQuotedTweetUrl] = useState<string | null>(null);
  const [showRetweet, setShowRetweet] = useState(true);
  const [isRetweetRemoved, setIsRetweetRemoved] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Thread editing state
  const [threadEditStates, setThreadEditStates] = useState<
    Map<string, ThreadTweetEditState>
  >(new Map());

  // Current editing tweet for threads
  const [currentEditingTweet, setCurrentEditingTweet] = useState<string | null>(
    null,
  );

  // @ mention functionality
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentMentionQuery, setCurrentMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // User search hook
  const { data: userSearchData, isLoading: isSearching } = useUserSearch(
    currentMentionQuery,
    currentMentionQuery.length > 0,
  );

  // Check if this is a thread
  const isThread = !!conversationId && threadTweets && threadTweets.length > 1;

  // Check if user has previously chosen to hide confirmation (only for confirmation mode)
  useEffect(() => {
    if (showConfirmation) {
      const hideConfirmation = localStorage.getItem(STORAGE_KEY);
      if (
        hideConfirmation === "true" &&
        isOpen &&
        (tweetData || databaseTweet)
      ) {
        // If user has chosen to hide confirmation, auto-save with current content
        handleSave();
      }
    }
  }, [isOpen, tweetData, databaseTweet, showConfirmation]);

  // Helper function to process tweet content for Farcaster
  const processContentForFarcaster = async (
    content: string,
    hasMediaAttached: boolean = false,
    originalContent?: string,
  ): Promise<string> => {
    let processedContent = content;

    // Remove t.co URLs (with or without "this@" prefix) but preserve whitespace
    processedContent = processedContent.replace(
      /this@https:\/\/t\.co\/\S*/g,
      "",
    );

    // Only remove the last t.co link if there's media attached
    if (hasMediaAttached) {
      const tcoRegex = /https:\/\/t\.co\/\S+/g;
      const matches = Array.from(processedContent.matchAll(tcoRegex));

      if (matches.length > 0) {
        // Only remove the last match
        const lastMatch = matches[matches.length - 1];
        if (lastMatch.index !== undefined) {
          const beforeLastLink = processedContent.substring(0, lastMatch.index);
          const afterLastLink = processedContent.substring(
            lastMatch.index + lastMatch[0].length,
          );
          processedContent = beforeLastLink + afterLastLink;
        }
      }
    }

    // Trim trailing whitespace
    processedContent = processedContent.replace(/\s+$/, "");

    // Convert Twitter mentions to Farcaster format
    processedContent = await convertTwitterMentionsToFarcaster(
      processedContent,
      true,
      originalContent,
    );

    // Resolve t.co URLs to their actual destinations
    processedContent = await resolveTcoUrls(processedContent);

    return processedContent;
  };

  // Simple cleanup function for UI display (non-Farcaster processing)
  const cleanupTweetContent = (
    content: string,
    hasMediaAttached?: boolean,
  ): string => {
    let cleaned = content;

    // Remove t.co URLs (with or without "this@" prefix) but preserve whitespace
    cleaned = cleaned.replace(/this@https:\/\/t\.co\/\S*/g, "");

    // Only remove the last t.co link if there's media attached
    if (hasMediaAttached) {
      const tcoRegex = /https:\/\/t\.co\/\S+/g;
      const matches = Array.from(cleaned.matchAll(tcoRegex));

      if (matches.length > 0) {
        // Only remove the last match
        const lastMatch = matches[matches.length - 1];
        if (lastMatch.index !== undefined) {
          const beforeLastLink = cleaned.substring(0, lastMatch.index);
          const afterLastLink = cleaned.substring(
            lastMatch.index + lastMatch[0].length,
          );
          cleaned = beforeLastLink + afterLastLink;
        }
      }
    }

    // Only trim trailing whitespace at the very end, preserve internal formatting
    cleaned = cleaned.replace(/\s+$/, "");
    return cleaned;
  };

  // Helper function to check if a tweet has media
  const tweetHasMedia = (tweet: any): boolean => {
    if (!tweet?.media_urls) {
      return false;
    }

    if (Array.isArray(tweet.media_urls)) {
      return tweet.media_urls.length > 0;
    }

    if (typeof tweet.media_urls === "object") {
      const urlKeys = ["images", "videos", "gifs", "photos"];
      return Object.entries(tweet.media_urls).some(([key, urls]) => {
        if (urlKeys.includes(key) && Array.isArray(urls)) {
          return urls.length > 0;
        }
        return false;
      });
    }

    if (typeof tweet.media_urls === "string") {
      return tweet.media_urls.trim().length > 0;
    }

    return false;
  };

  // Initialize thread editing states
  useEffect(() => {
    if (isThread && threadTweets && isOpen) {
      const initializeThreadStates = async () => {
        const newStates = new Map<string, ThreadTweetEditState>();

        for (const tweet of threadTweets) {
          const tweetContent = tweet.content || "";

          try {
            // Process the content to show what would be casted
            const processedText = await processContentForFarcaster(
              tweetContent,
              tweetHasMedia(tweet),
              tweetContent,
            );

            // Handle media URLs using utility function
            const { imageUrls, videoUrls: videoUrlsArray } = parseMediaUrls(
              tweet.media_urls,
            );

            newStates.set(tweet.tweet_id, {
              content: processedText,
              mediaUrls: imageUrls,
              videoUrls: videoUrlsArray,
              quotedTweetUrl: null, // TODO: Add quoted tweet support for threads if needed
              showRetweet: true,
              isRetweetRemoved: false,
            });
          } catch (error) {
            console.error(
              `Error parsing thread tweet ${tweet.tweet_id}:`,
              error,
            );
            const cleanedContent = await processContentForFarcaster(
              tweetContent,
              tweetHasMedia(tweet),
              tweetContent,
            );

            // Handle media URLs using utility function
            const { imageUrls, videoUrls: videoUrlsArray } = parseMediaUrls(
              tweet.media_urls,
            );

            newStates.set(tweet.tweet_id, {
              content: cleanedContent,
              mediaUrls: imageUrls,
              videoUrls: videoUrlsArray,
              quotedTweetUrl: null,
              showRetweet: true,
              isRetweetRemoved: false,
            });
          }
        }

        setThreadEditStates(newStates);

        // Set the first tweet as currently editing
        if (threadTweets.length > 0) {
          setCurrentEditingTweet(threadTweets[0].tweet_id);
        }
      };

      initializeThreadStates();
    }
  }, [isThread, threadTweets, isOpen]);

  // Update state when tweet data loads (for single tweets)
  useEffect(() => {
    if ((tweetData || databaseTweet) && isOpen && !isThread) {
      const initializeSingleTweet = async () => {
        // Use database tweet data if available, otherwise fall back to Twitter API data
        const tweet = databaseTweet || tweetData;

        if (isRetweet) {
          // For retweets, keep the text area empty
          setContent("");
        } else {
          // For regular tweets, get the original text and parse it
          const text = databaseTweet
            ? databaseTweet.content || databaseTweet.original_content || ""
            : tweetData?.text || "";
          setOriginalContent(text);

          // Process the content to show what would be casted
          try {
            const processedText = await processContentForFarcaster(
              text,
              tweetHasMedia(tweet),
              text,
            );
            setContent(processedText);
          } catch (error) {
            console.error("Error parsing tweet content:", error);
            const cleanedText = await processContentForFarcaster(
              text,
              tweetHasMedia(tweet),
              text,
            );
            setContent(cleanedText);
          }

          setContentWasEdited(false); // Reset edit flag
        }

        // Handle media from database structure or Twitter API using utility function
        const mediaSource = databaseTweet?.media_urls || null;
        const twitterMediaDetails = tweetData?.mediaDetails || undefined;

        const { imageUrls, videoUrls: videoUrlsArray } = parseMediaUrls(
          mediaSource,
          twitterMediaDetails,
        );
        setMediaUrls(imageUrls);
        setVideoUrls(videoUrlsArray);

        setQuotedTweetUrl(
          tweetData?.quoted_tweet
            ? `https://twitter.com/${tweetData.quoted_tweet.user.screen_name}/status/${tweetData.quoted_tweet.id_str}`
            : null,
        );
        setShowRetweet(true);
      };

      initializeSingleTweet();
    }
  }, [tweetData, databaseTweet, isOpen, isRetweet, isThread]);

  // Reset all edits when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setOriginalContent("");
      setContentWasEdited(false);
      setMediaUrls([]);
      setVideoUrls([]);
      setQuotedTweetUrl(null);
      setShowRetweet(true);
      setIsRetweetRemoved(false);
      setShowUserDropdown(false);
      setCurrentMentionQuery("");
      setDontShowAgain(false);
      setThreadEditStates(new Map());
      setCurrentEditingTweet(null);
    }
  }, [isOpen]);

  // Get current editing state (for threads)
  const getCurrentEditingState = (): ThreadTweetEditState | null => {
    if (!currentEditingTweet || !threadEditStates.has(currentEditingTweet)) {
      return null;
    }
    return threadEditStates.get(currentEditingTweet)!;
  };

  // Update current editing state (for threads)
  const updateCurrentEditingState = (
    updates: Partial<ThreadTweetEditState>,
  ) => {
    if (!currentEditingTweet) return;

    setThreadEditStates((prev) => {
      const newStates = new Map(prev);
      const currentState = newStates.get(currentEditingTweet);
      if (currentState) {
        newStates.set(currentEditingTweet, { ...currentState, ...updates });
      }
      return newStates;
    });
  };

  // Get display content and media based on editing mode
  const getDisplayContent = () => {
    if (isThread && currentEditingTweet) {
      const currentState = getCurrentEditingState();
      return {
        content: currentState?.content || "",
        mediaUrls: currentState?.mediaUrls || [],
        videoUrls: currentState?.videoUrls || [],
        quotedTweetUrl: currentState?.quotedTweetUrl || null,
        showRetweet: currentState?.showRetweet ?? true,
        isRetweetRemoved: currentState?.isRetweetRemoved ?? false,
      };
    }
    return {
      content,
      mediaUrls,
      videoUrls,
      quotedTweetUrl,
      showRetweet,
      isRetweetRemoved,
    };
  };

  const displayState = getDisplayContent();

  const removeImage = (indexToRemove: number) => {
    if (isThread && currentEditingTweet) {
      updateCurrentEditingState({
        mediaUrls: displayState.mediaUrls.filter(
          (_, index) => index !== indexToRemove,
        ),
      });
    } else {
      setMediaUrls((prev) =>
        prev.filter((_, index) => index !== indexToRemove),
      );
    }
  };

  const removeVideo = (indexToRemove: number) => {
    if (isThread && currentEditingTweet) {
      updateCurrentEditingState({
        videoUrls: displayState.videoUrls.filter(
          (_, index) => index !== indexToRemove,
        ),
      });
    } else {
      setVideoUrls((prev) =>
        prev.filter((_, index) => index !== indexToRemove),
      );
    }
  };

  const removeQuoteTweet = () => {
    if (isThread && currentEditingTweet) {
      updateCurrentEditingState({ quotedTweetUrl: null });
    } else {
      setQuotedTweetUrl(null);
    }
  };

  const removeRetweet = () => {
    if (isThread && currentEditingTweet) {
      updateCurrentEditingState({
        showRetweet: false,
        isRetweetRemoved: true,
      });
    } else {
      setShowRetweet(false);
      setIsRetweetRemoved(true);
    }
  };

  const handleSave = () => {
    if (showConfirmation && dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }

    if (isThread && threadTweets) {
      // For threads, collect all thread tweet edits
      const threadTweetEdits = threadTweets.map((tweet) => {
        const editState = threadEditStates.get(tweet.tweet_id);
        return {
          tweetId: tweet.tweet_id,
          content: editState?.content || "",
          mediaUrls: editState?.mediaUrls || [],
          videoUrls: editState?.videoUrls || [],
          isRetweetRemoved: editState?.isRetweetRemoved || false,
        };
      });

      // For thread mode, pass the first tweet's data as main params and thread data separately
      const firstTweetState = threadEditStates.get(threadTweets[0]?.tweet_id);
      onSave(
        firstTweetState?.content || "",
        firstTweetState?.mediaUrls || [],
        firstTweetState?.quotedTweetUrl || null,
        firstTweetState?.isRetweetRemoved || false,
        firstTweetState?.videoUrls || [],
        threadTweetEdits,
      );
    } else {
      // Single tweet mode - use original content if nothing was edited
      const contentToSend = contentWasEdited
        ? displayState.content
        : originalContent;
      onSave(
        contentToSend,
        displayState.mediaUrls,
        displayState.quotedTweetUrl,
        displayState.isRetweetRemoved,
        displayState.videoUrls,
      );
    }
  };

  const handleClose = () => {
    if (showConfirmation) {
      setDontShowAgain(false);
    }
    onClose();
  };

  // Handle @ mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursor = e.target.selectionStart;

    if (isThread && currentEditingTweet) {
      // For threads, we need to update the raw content but let the parsing effect handle the display
      updateCurrentEditingState({ content: newContent });
    } else {
      // For single tweets, update the raw content
      setContent(newContent);
      setContentWasEdited(true); // Mark content as manually edited
    }
    setCursorPosition(cursor);

    // Check for @ mention
    const textBeforeCursor = newContent.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setCurrentMentionQuery(query);
      setShowUserDropdown(true);
    } else {
      setShowUserDropdown(false);
      setCurrentMentionQuery("");
    }
  };

  // Handle user selection from dropdown
  const handleUserSelect = (user: FarcasterUser) => {
    if (!textareaRef.current) return;

    const currentContent =
      isThread && currentEditingTweet ? displayState.content : content;
    const textBeforeCursor = currentContent.slice(0, cursorPosition);
    const textAfterCursor = currentContent.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const userMention = `@${user.username}`;
      const newContent = beforeMention + userMention + textAfterCursor;
      const newCursorPosition = beforeMention.length + userMention.length;

      if (isThread && currentEditingTweet) {
        updateCurrentEditingState({ content: newContent });
      } else {
        setContent(newContent);
      }
      setShowUserDropdown(false);
      setCurrentMentionQuery("");

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            newCursorPosition,
            newCursorPosition,
          );
        }
      }, 0);
    }
  };

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowUserDropdown(false);
        setCurrentMentionQuery("");
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showUserDropdown &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
        setCurrentMentionQuery("");
      }
    };

    if (showUserDropdown) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Show loading state while tweet data is loading
  if (!tweetData && !databaseTweet && isOpen && (!isThread || threadLoading)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-white/20 z-40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="fixed bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden bottom-2 left-2 right-2 rounded-[32px] p-6"
        >
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/20 z-40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="fixed  bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-y-auto bottom-2 left-2 right-2 rounded-[32px] p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#100c20] text-base">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="p-1 -m-1 touch-manipulation"
              >
                <Cross />
              </button>
            </div>
            <div className="overflow-hidden my-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="339"
                height="9"
                viewBox="0 0 339 9"
                fill="none"
              >
                <path
                  d="M0.542969 8L6.83464 4.5C10.7468 2.3237 15.5058 2.3237 19.418 4.5V4.5C23.3301 6.6763 28.0891 6.6763 32.0013 4.5V4.5C35.9134 2.3237 40.6725 2.3237 44.5846 4.5V4.5C48.4968 6.6763 53.2558 6.6763 57.168 4.5V4.5C61.0801 2.3237 65.8391 2.32371 69.7513 4.5V4.5C73.6634 6.6763 78.4225 6.6763 82.3346 4.5V4.5C86.2468 2.3237 91.0058 2.32371 94.918 4.5V4.5C98.8301 6.6763 103.589 6.6763 107.501 4.5V4.5C111.413 2.3237 116.172 2.32371 120.085 4.5V4.5C123.997 6.67629 128.756 6.6763 132.668 4.5V4.5C136.58 2.32371 141.339 2.32371 145.251 4.5V4.5C149.163 6.67629 153.922 6.6763 157.835 4.5V4.5C161.747 2.3237 166.506 2.32371 170.418 4.5V4.5C174.33 6.67629 179.089 6.6763 183.001 4.5V4.5C186.913 2.3237 191.672 2.32371 195.585 4.5V4.5C199.497 6.67629 204.256 6.67629 208.168 4.5V4.5C212.08 2.3237 216.839 2.3237 220.751 4.5V4.5C224.663 6.6763 229.422 6.67629 233.335 4.5V4.5C237.247 2.32371 242.006 2.32371 245.918 4.5V4.5C249.83 6.67629 254.589 6.6763 258.501 4.5V4.5C262.413 2.3237 267.202 2.34012 271.114 4.51641V4.51641C274.99 6.67239 279.734 6.68865 283.609 4.53267L283.899 4.37148C287.659 2.2801 292.268 2.33272 295.994 4.48375V4.48375C299.745 6.64955 304.395 6.66581 308.146 4.5V4.5C311.897 2.33419 316.519 2.33419 320.271 4.5V4.5C324.022 6.66581 328.644 6.66581 332.395 4.5L338.457 1"
                  stroke="#E2E2E4"
                />
              </svg>
            </div>

            {/* Thread Navigation */}
            {isThread && threadTweets && threadTweets.length > 1 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-[#8C8A94]">
                    Thread ({threadTweets.length} tweets)
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {threadTweets.map((tweet, index) => (
                    <button
                      key={tweet.tweet_id}
                      onClick={() => setCurrentEditingTweet(tweet.tweet_id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        currentEditingTweet === tweet.tweet_id
                          ? "bg-[#494656] text-white"
                          : "bg-[#F8F8F8] text-[#8C8A94] hover:bg-[#ECECED]"
                      }`}
                    >
                      Tweet {tweet.thread_position || index + 1}
                    </button>
                  ))}
                </div>
                {currentEditingTweet && (
                  <div className="mt-2 text-xs text-[#8C8A94]">
                    Editing: Tweet{" "}
                    {threadTweets.find(
                      (t) => t.tweet_id === currentEditingTweet,
                    )?.thread_position || 1}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={displayState.content}
                  onChange={handleContentChange}
                  className="w-full p-3 rounded-xl resize-none focus:outline-none focus:border-transparent bg-[#f8f8f8] text-sm leading-relaxed touch-manipulation rows-6"
                  rows={4}
                  maxLength={280}
                  placeholder={"What's happening? Use @ to mention users"}
                />
                <UserMentionDropdown
                  users={userSearchData?.result?.users || []}
                  isVisible={showUserDropdown}
                  onUserSelect={handleUserSelect}
                  position={{ top: 65, left: 0 }}
                />
              </div>

              {displayState.mediaUrls.length > 0 && !isRetweet && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {displayState.mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url.url}
                          alt={`Media ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover w-full h-24"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 transition-opacity hover:bg-white touch-manipulation"
                        >
                          <Trash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayState.videoUrls.length > 0 && !isRetweet && (
                <div className="mt-2">
                  <div className="grid grid-cols-1 gap-2">
                    {displayState.videoUrls.map((videoObj, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={videoObj.url}
                          controls
                          preload="metadata"
                          className={`w-full h-auto object-cover rounded-lg ${
                            showConfirmation ? "max-h-20" : "max-h-32"
                          }`}
                          playsInline
                        >
                          Your browser does not support the video tag.
                        </video>
                        <button
                          onClick={() => removeVideo(index)}
                          className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 transition-opacity hover:bg-white touch-manipulation"
                        >
                          <Trash />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {videoObj.content_type} •{" "}
                          {Math.round(videoObj.bitrate / 1000)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display retweet content */}
              {isRetweet && tweetData && displayState.showRetweet && (
                <div className="mt-2">
                  <div className="relative group border border-[#ECECED] rounded-xl bg-white overflow-y-auto">
                    <div className="p-3">
                      <button
                        onClick={removeRetweet}
                        className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 transition-opacity hover:bg-white z-10 touch-manipulation"
                      >
                        <Trash />
                      </button>
                      <div className="flex items-start gap-2">
                        <Image
                          src={tweetData.user.profile_image_url_https}
                          alt={tweetData.user.name}
                          width={20}
                          height={20}
                          className="rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col items-start gap-0.5 text-xs text-[#8C8A94]">
                            <span className="font-semibold text-[#100C20] truncate max-w-full text-sm">
                              {tweetData.user.name}
                            </span>
                            <div className="text-xs">
                              <span>@{tweetData.user.screen_name}</span>
                              <span> · </span>
                              <span>
                                {new Date(
                                  tweetData.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-[#100C20] mt-1 leading-relaxed break-words">
                            {cleanupTweetContent(
                              tweetData.text || "",
                              tweetHasMedia(tweetData),
                            )}
                          </p>
                          {/* Display media inside retweet */}
                          {displayState.mediaUrls.length > 0 && (
                            <div className="mt-2">
                              <div className="grid grid-cols-2 gap-2">
                                {displayState.mediaUrls.map((url, index) => (
                                  <div key={index} className="relative">
                                    <Image
                                      src={url.url}
                                      alt={`Media ${index + 1}`}
                                      width={100}
                                      height={100}
                                      className="rounded-lg object-cover w-full h-24"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Display videos inside retweet */}
                          {displayState.videoUrls.length > 0 && (
                            <div className="mt-2">
                              <div className="grid grid-cols-1 gap-2">
                                {displayState.videoUrls.map(
                                  (videoObj, index) => (
                                    <div key={index} className="relative">
                                      <video
                                        src={videoObj.url}
                                        controls
                                        preload="metadata"
                                        className={`w-full h-auto object-cover rounded-lg ${
                                          showConfirmation
                                            ? "max-h-20"
                                            : "max-h-24"
                                        }`}
                                        playsInline
                                      >
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        {videoObj.content_type} •{" "}
                                        {Math.round(videoObj.bitrate / 1000)}k
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {displayState.quotedTweetUrl && tweetData?.quoted_tweet && (
                <div className="mt-2">
                  <div
                    className={`relative group border border-[#ECECED] rounded-xl bg-white overflow-y-auto ${
                      showConfirmation ? "max-h-20" : "max-h-24"
                    }`}
                  >
                    <div className="p-3">
                      <button
                        onClick={removeQuoteTweet}
                        className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 transition-opacity hover:bg-white z-10 touch-manipulation"
                      >
                        <Trash />
                      </button>
                      <div className="flex items-start gap-2">
                        <Image
                          src={
                            tweetData.quoted_tweet.user.profile_image_url_https
                          }
                          alt={tweetData.quoted_tweet.user.name}
                          width={20}
                          height={20}
                          className="rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col items-start gap-0.5 text-xs text-[#8C8A94]">
                            <span className="font-semibold text-[#100C20] truncate max-w-full text-sm">
                              {tweetData.quoted_tweet.user.name}
                            </span>
                            <div className="text-xs">
                              <span>
                                @{tweetData.quoted_tweet.user.screen_name}
                              </span>
                              <span> · </span>
                              <span>
                                {new Date(
                                  tweetData.quoted_tweet.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-[#100C20] mt-1 leading-relaxed break-words">
                            {cleanupTweetContent(
                              tweetData.quoted_tweet.text || "",
                              tweetHasMedia(tweetData.quoted_tweet),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Don't show again checkbox - only for confirmation mode */}
              {showConfirmation && (
                <div className="flex items-center space-x-2 mt-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className="flex items-center justify-center w-4 h-4 rounded-md border-2 transition-all duration-200 touch-manipulation focus:outline-none focus:ring-none focus:ring-offset-0"
                    style={{
                      borderColor: dontShowAgain ? "#494656" : "#494656",
                      backgroundColor: dontShowAgain
                        ? "#494656"
                        : "transparent",
                    }}
                  >
                    {dontShowAgain && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <label
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className="text-sm text-[#494656] cursor-pointer select-none"
                  >
                    Don't show this confirmation again
                  </label>
                </div>
              )}

              <Button
                className={`${showConfirmation ? "flex-1" : "w-full"} text-base py-3 touch-manipulation ${
                  showConfirmation ? "" : "mt-6"
                }`}
                onClick={handleSave}
                disabled={
                  isLoading ||
                  (!isRetweet &&
                    displayState.content.length === 0 &&
                    displayState.mediaUrls.length === 0 &&
                    displayState.videoUrls.length === 0) ||
                  (isRetweet &&
                    displayState.content.length === 0 &&
                    !displayState.showRetweet) ||
                  (isThread && (!threadTweets || threadTweets.length === 0)) ||
                  false
                }
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Casting...</span>
                  </div>
                ) : (
                  "Cast"
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Utility functions for confirmation functionality
export function shouldShowCastConfirmation(): boolean {
  if (typeof window === "undefined") return true; // Server-side
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

export function resetCastConfirmationPreference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
