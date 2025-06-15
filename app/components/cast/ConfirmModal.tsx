import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTweet } from "react-tweet";
import Cross from "../icons/Cross";
import Trash from "../icons/Trash";
import Button from "../ui/Button";
import Image from "next/image";
import { useUserSearch, FarcasterUser } from "@/hooks/useUserSearch";
import UserMentionDropdown from "../ui/UserMentionDropdown";

interface ConfirmModalProps {
  tweetId: string;
  onSave: (
    content: string,
    mediaUrls: string[],
    quotedTweetUrl: string | null,
    isRetweetRemoved: boolean,
    videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>,
  ) => void;
  onClose: () => void;
  isLoading: boolean;
  isOpen: boolean;
  isRetweet?: boolean;
  databaseTweet?: any; // Database tweet data with custom media structure
  title?: string;
  message?: string;
}

const STORAGE_KEY = "xcast_hide_cast_confirmation";

export function ConfirmModal({
  tweetId,
  onSave,
  onClose,
  isLoading,
  isOpen,
  isRetweet = false,
  databaseTweet,
  title = "Ready to cast?",
  message = "Review your cast and publish it to Farcaster. You can always edit or delete it later.",
}: ConfirmModalProps) {
  const { data: tweetData } = useTweet(tweetId);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<
    Array<{ url: string; bitrate: number; content_type: string }>
  >([]);
  const [quotedTweetUrl, setQuotedTweetUrl] = useState<string | null>(null);
  const [showRetweet, setShowRetweet] = useState(true);
  const [isRetweetRemoved, setIsRetweetRemoved] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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

  // Check if user has previously chosen to hide confirmation
  useEffect(() => {
    const hideConfirmation = localStorage.getItem(STORAGE_KEY);
    if (hideConfirmation === "true" && isOpen && (tweetData || databaseTweet)) {
      // If user has chosen to hide confirmation, auto-save with current content
      handleSave();
    }
  }, [isOpen, tweetData, databaseTweet]);

  // Cleanup tweet content function
  const cleanupTweetContent = (content: string): string => {
    let cleaned = content;
    // Remove t.co URLs (with or without "this@" prefix) but preserve whitespace
    cleaned = cleaned.replace(/this@https:\/\/t\.co\/\S*/g, "");
    cleaned = cleaned.replace(/https:\/\/t\.co\/\S*/g, "");
    // Only trim trailing whitespace at the very end, preserve internal formatting
    cleaned = cleaned.replace(/\s+$/, "");
    return cleaned;
  };

  // Update state when tweet data loads
  useEffect(() => {
    if ((tweetData || databaseTweet) && isOpen) {
      // Use database tweet data if available, otherwise fall back to Twitter API data
      const tweet = databaseTweet || tweetData;

      if (isRetweet) {
        // For retweets, keep the text area empty
        setContent("");
      } else {
        // For regular tweets, use the cleaned content
        const text = databaseTweet
          ? databaseTweet.content || databaseTweet.original_content || ""
          : tweetData?.text || "";
        setContent(cleanupTweetContent(text));
      }

      // Handle media from database structure or Twitter API
      if (databaseTweet && databaseTweet.media_urls) {
        if (
          typeof databaseTweet.media_urls === "object" &&
          !Array.isArray(databaseTweet.media_urls)
        ) {
          // New structure with images and videos
          setMediaUrls(databaseTweet.media_urls.images || []);
          setVideoUrls(databaseTweet.media_urls.videos || []);
        } else if (Array.isArray(databaseTweet.media_urls)) {
          // Old structure - assume they're all images
          setMediaUrls(databaseTweet.media_urls);
          setVideoUrls([]);
        }
      } else if (tweetData) {
        // Twitter API data
        setMediaUrls(
          tweetData.mediaDetails?.map((media: any) => media.media_url_https) ||
            [],
        );
        setVideoUrls([]);
      }

      setQuotedTweetUrl(
        tweetData?.quoted_tweet
          ? `https://twitter.com/${tweetData.quoted_tweet.user.screen_name}/status/${tweetData.quoted_tweet.id_str}`
          : null,
      );
      setShowRetweet(true);
    }
  }, [tweetData, databaseTweet, isOpen, isRetweet]);

  // Reset all edits when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setMediaUrls([]);
      setVideoUrls([]);
      setQuotedTweetUrl(null);
      setShowRetweet(true);
      setIsRetweetRemoved(false);
      setShowUserDropdown(false);
      setCurrentMentionQuery("");
      setDontShowAgain(false);
    }
  }, [isOpen]);

  const removeImage = (indexToRemove: number) => {
    setMediaUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeVideo = (indexToRemove: number) => {
    setVideoUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeQuoteTweet = () => {
    setQuotedTweetUrl(null);
  };

  const removeRetweet = () => {
    setShowRetweet(false);
    setIsRetweetRemoved(true);
  };

  const handleSave = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onSave(content, mediaUrls, quotedTweetUrl, isRetweetRemoved, videoUrls);
  };

  const handleClose = () => {
    setDontShowAgain(false);
    onClose();
  };

  // Handle @ mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursor = e.target.selectionStart;

    setContent(newContent);
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

    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const userMention = `@${user.username}`;
      const newContent = beforeMention + userMention + textAfterCursor;
      const newCursorPosition = beforeMention.length + userMention.length;

      setContent(newContent);
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
  if (!tweetData && !databaseTweet && isOpen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-white/20 z-40 backdrop-blur-sm"
          onClick={onClose}
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
            className="fixed bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden bottom-2 left-2 right-2 rounded-[32px] p-6"
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
                  d="M0.542969 8L6.83464 4.5C10.7468 2.3237 15.5058 2.3237 19.418 4.5V4.5C23.3301 6.6763 28.0891 6.6763 32.0013 4.5V4.5C35.9134 2.3237 40.6725 2.3237 44.5846 4.5V4.5C48.4968 6.6763 53.2558 6.6763 57.168 4.5V4.5C61.0801 2.3237 65.8391 2.3237 69.7513 4.5V4.5C73.6634 6.6763 78.4225 6.6763 82.3346 4.5V4.5C86.2468 2.3237 91.0058 2.3237 94.918 4.5V4.5C98.8301 6.6763 103.589 6.6763 107.501 4.5V4.5C111.413 2.3237 116.172 2.32371 120.085 4.5V4.5C123.997 6.67629 128.756 6.6763 132.668 4.5V4.5C136.58 2.3237 141.339 2.32371 145.251 4.5V4.5C149.163 6.67629 153.922 6.6763 157.835 4.5V4.5C161.747 2.3237 166.506 2.32371 170.418 4.5V4.5C174.33 6.67629 179.089 6.6763 183.001 4.5V4.5C186.913 2.3237 191.672 2.32371 195.585 4.5V4.5C199.497 6.67629 204.256 6.67629 208.168 4.5V4.5C212.08 2.3237 216.839 2.3237 220.751 4.5V4.5C224.663 6.6763 229.422 6.67629 233.335 4.5V4.5C237.247 2.32371 242.006 2.32371 245.918 4.5V4.5C249.83 6.67629 254.589 6.6763 258.501 4.5V4.5C262.413 2.3237 267.202 2.34012 271.114 4.51641V4.51641C274.99 6.67239 279.734 6.68865 283.609 4.53267L283.899 4.37148C287.659 2.2801 292.268 2.33272 295.994 4.48375V4.48375C299.745 6.64955 304.395 6.66581 308.146 4.5V4.5C311.897 2.33419 316.519 2.33419 320.271 4.5V4.5C324.022 6.66581 328.644 6.66581 332.395 4.5L338.457 1"
                  stroke="#E2E2E4"
                />
              </svg>
            </div>

            <div>
              <p className="text-[#100c20] text-sm leading-relaxed mb-4">
                {message}
              </p>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
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

              {mediaUrls.length > 0 && !isRetweet && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
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

              {videoUrls.length > 0 && !isRetweet && (
                <div className="mt-2">
                  <div className="grid grid-cols-1 gap-2">
                    {videoUrls.map((videoObj, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={videoObj.url}
                          controls
                          preload="metadata"
                          className="w-full h-auto max-h-32 object-cover rounded-lg"
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
              {isRetweet && tweetData && showRetweet && (
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
                            {cleanupTweetContent(tweetData.text || "")}
                          </p>
                          {/* Display media inside retweet */}
                          {mediaUrls.length > 0 && (
                            <div className="mt-2">
                              <div className="grid grid-cols-2 gap-2">
                                {mediaUrls.map((url, index) => (
                                  <div key={index} className="relative">
                                    <Image
                                      src={url}
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
                          {videoUrls.length > 0 && (
                            <div className="mt-2">
                              <div className="grid grid-cols-1 gap-2">
                                {videoUrls.map((videoObj, index) => (
                                  <div key={index} className="relative">
                                    <video
                                      src={videoObj.url}
                                      controls
                                      preload="metadata"
                                      className="w-full h-auto max-h-24 object-cover rounded-lg"
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
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {quotedTweetUrl && tweetData?.quoted_tweet && (
                <div className="mt-2">
                  <div className="relative group border border-[#ECECED] rounded-xl bg-white max-h-24 overflow-y-auto">
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
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 mt-4 mb-6">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-[#8C5CF6] bg-gray-100 border-gray-300 rounded focus:ring-[#8C5CF6] focus:ring-2"
                />
                <label
                  htmlFor="dontShowAgain"
                  className="text-sm text-[#8C8A94] cursor-pointer select-none"
                >
                  Don't show this confirmation again
                </label>
              </div>
              <Button
                className="flex-1 text-base py-3 touch-manipulation"
                onClick={handleSave}
                disabled={
                  isLoading ||
                  (!isRetweet && content.length === 0) ||
                  (isRetweet && content.length === 0 && !showRetweet)
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

// Utility function to check if confirmation should be shown
export function shouldShowCastConfirmation(): boolean {
  if (typeof window === "undefined") return true; // Server-side
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

// Utility function to reset the confirmation preference
export function resetCastConfirmationPreference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
