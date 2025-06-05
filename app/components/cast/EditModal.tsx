import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTweet } from "react-tweet";
import Cross from "../icons/Cross";
import Trash from "../icons/Trash";
import Button from "../ui/Button";
import Image from "next/image";

interface EditModalProps {
  tweetId: string;
  onSave: (
    content: string,
    mediaUrls: string[],
    quotedTweetUrl: string | null,
  ) => void;
  onClose: () => void;
  isLoading: boolean;
  isOpen: boolean;
}

export function EditModal({
  tweetId,
  onSave,
  onClose,
  isLoading,
  isOpen,
}: EditModalProps) {
  const { data: tweetData } = useTweet(tweetId);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [quotedTweetUrl, setQuotedTweetUrl] = useState<string | null>(null);

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
    if (tweetData && isOpen) {
      setContent(cleanupTweetContent(tweetData.text || ""));
      setMediaUrls(
        tweetData.mediaDetails?.map((media: any) => media.media_url_https) ||
          [],
      );
      setQuotedTweetUrl(
        tweetData.quoted_tweet
          ? `https://twitter.com/${tweetData.quoted_tweet.user.screen_name}/status/${tweetData.quoted_tweet.id_str}`
          : null,
      );
    }
  }, [tweetData, isOpen]);

  const removeImage = (indexToRemove: number) => {
    setMediaUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeQuoteTweet = () => {
    setQuotedTweetUrl(null);
  };

  const handleSave = () => {
    onSave(content, mediaUrls, quotedTweetUrl);
  };

  // Show loading state while tweet data is loading
  if (!tweetData && isOpen) {
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
            className="fixed  bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden bottom-2 left-2 right-2 rounded-[32px] p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#100c20] text-base">
                Edit cast
              </h3>
              <button onClick={onClose} className="p-1 -m-1 touch-manipulation">
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
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl resize-none focus:outline-none focus:border-transparent bg-[#f8f8f8] text-sm leading-relaxed touch-manipulation rows-6"
                rows={4}
                maxLength={280}
                placeholder="What's happening?"
              />

              {mediaUrls.length > 0 && (
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

              <Button
                className="mt-6 w-full text-base py-3 touch-manipulation"
                onClick={handleSave}
                disabled={isLoading || content.length === 0}
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
