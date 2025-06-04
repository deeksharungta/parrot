import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cross from "../icons/Cross";
import Trash from "../icons/Trash";
import Button from "../ui/Button";
import Image from "next/image";

interface Tweet {
  id: string;
  content: string;
  twitter_created_at: string | null;
  twitter_url: string | null;
  cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
  is_edited: boolean;
  media_urls?: string[] | null;
  quoted_tweet_url?: string | null;
  quoted_tweet?: {
    id: string;
    content: string;
    user: {
      name: string;
      username: string;
      profile_image_url: string;
    };
    created_at: string;
  } | null;
}

interface EditModalProps {
  tweet: Tweet;
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
  tweet,
  onSave,
  onClose,
  isLoading,
  isOpen,
}: EditModalProps) {
  const [content, setContent] = useState(tweet.content);
  const [mediaUrls, setMediaUrls] = useState<string[]>(tweet.media_urls || []);
  const [quotedTweetUrl, setQuotedTweetUrl] = useState<string | null>(
    tweet.quoted_tweet_url || null,
  );

  const removeImage = (indexToRemove: number) => {
    setMediaUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeQuoteTweet = () => {
    setQuotedTweetUrl(null);
  };

  const handleSave = () => {
    onSave(content, mediaUrls, quotedTweetUrl);
  };

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
            className="fixed bottom-1 left-1 right-1 bg-white rounded-[24px] border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden p-4 sm:bottom-2 sm:left-2 sm:right-2 sm:rounded-[32px] sm:p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#100c20] sm:text-base">
                Edit cast
              </h3>
              <button onClick={onClose} className="p-1 -m-1 touch-manipulation">
                <Cross />
              </button>
            </div>
            <div className="mb-4 overflow-hidden sm:my-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="7"
                viewBox="0 0 304 7"
                fill="none"
                className="max-w-full"
              >
                <path
                  d="M1 1L7.29164 4.49999C11.2038 6.67629 15.9628 6.6763 19.875 4.5V4.5C23.7871 2.3237 28.5462 2.3237 32.4583 4.5V4.5C36.3705 6.67629 41.1295 6.6763 45.0416 4.5V4.5C48.9538 2.3237 53.7128 2.3237 57.625 4.5V4.5C61.5371 6.6763 66.2961 6.6763 70.2083 4.5V4.5C74.1204 2.3237 78.8795 2.3237 82.7916 4.5V4.5C86.7038 6.6763 91.4628 6.6763 95.375 4.5V4.5C99.2871 2.3237 104.046 2.3237 107.958 4.5V4.5C111.87 6.6763 116.629 6.6763 120.542 4.5V4.5C124.454 2.3237 129.213 2.3237 133.125 4.5V4.5C137.037 6.6763 141.796 6.6763 145.708 4.5V4.5C149.62 2.3237 154.379 2.3237 158.292 4.5V4.5C162.204 6.6763 166.963 6.6763 170.875 4.5V4.5C174.787 2.3237 179.546 2.3237 183.458 4.5V4.5C187.37 6.6763 192.129 6.6763 196.042 4.5V4.5C199.954 2.3237 204.713 2.3237 208.625 4.5V4.5C212.537 6.6763 217.296 6.6763 221.208 4.5V4.5C225.12 2.3237 229.879 2.3237 233.792 4.5V4.5C237.704 6.6763 242.463 6.6763 246.375 4.5V4.5C250.287 2.3237 255.046 2.3237 258.958 4.5V4.5C262.87 6.6763 267.63 6.6763 271.542 4.5V4.5C275.454 2.3237 280.213 2.3237 284.125 4.5V4.5C288.037 6.6763 292.796 6.6763 296.708 4.5L303 1"
                  stroke="#E2E2E4"
                />
              </svg>
            </div>
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl resize-none focus:outline-none focus:border-transparent bg-[#f8f8f8] text-sm leading-relaxed touch-manipulation sm:rows-6"
                rows={4}
                maxLength={280}
                placeholder="What's happening?"
              />

              {mediaUrls.length > 0 && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Media ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover w-full h-20 sm:h-24"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white touch-manipulation"
                        >
                          <Trash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quotedTweetUrl && tweet.quoted_tweet && (
                <div className="mt-2">
                  <div className="relative group border border-[#ECECED] rounded-xl bg-white max-h-20 sm:max-h-24 overflow-y-auto">
                    <div className="p-2 sm:p-3">
                      <button
                        onClick={removeQuoteTweet}
                        className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white z-10 touch-manipulation"
                      >
                        <Trash />
                      </button>
                      <div className="flex items-start gap-2">
                        <Image
                          src={tweet.quoted_tweet.user.profile_image_url}
                          alt={tweet.quoted_tweet.user.name}
                          width={20}
                          height={20}
                          className="rounded-full flex-shrink-0 sm:w-6 sm:h-6"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col items-start gap-0.5 text-xs text-[#8C8A94]">
                            <span className="font-semibold text-[#100C20] truncate max-w-full text-xs sm:text-sm">
                              {tweet.quoted_tweet.user.name}
                            </span>
                            <div className="text-xs">
                              <span>@{tweet.quoted_tweet.user.username}</span>
                              <span> · </span>
                              <span>
                                {new Date(
                                  tweet.quoted_tweet.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-[#100C20] mt-1 leading-relaxed break-words">
                            {tweet.quoted_tweet.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="mt-4 sm:mt-6 w-full text-base py-3 touch-manipulation"
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
