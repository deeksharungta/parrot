import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cross from "../icons/Cross";
import Button from "../ui/Button";
import Toggle from "../ui/Toggle";

interface YoloModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: {
    castRetweets: boolean;
    castQuoteTweets: boolean;
  }) => void;
  isLoading: boolean;
  currentSettings: {
    castRetweets: boolean;
    castQuoteTweets: boolean;
  };
  isConfiguring?: boolean; // true when reconfiguring, false when enabling for first time
}

export default function YoloModeModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
  currentSettings,
  isConfiguring = false,
}: YoloModeModalProps) {
  const [castRetweets, setCastRetweets] = useState(
    currentSettings.castRetweets,
  );
  const [castQuoteTweets, setCastQuoteTweets] = useState(
    currentSettings.castQuoteTweets,
  );

  // Update local state when currentSettings change
  useEffect(() => {
    setCastRetweets(currentSettings.castRetweets);
    setCastQuoteTweets(currentSettings.castQuoteTweets);
  }, [currentSettings]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCastRetweets(currentSettings.castRetweets);
      setCastQuoteTweets(currentSettings.castQuoteTweets);
    }
  }, [isOpen, currentSettings]);

  const handleSave = () => {
    onSave({
      castRetweets,
      castQuoteTweets,
    });
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
            className="fixed bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-hidden bottom-2 left-2 right-2 rounded-[32px] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#100c20] text-base">
                {isConfiguring ? "YOLO Mode Settings" : "Enable YOLO Mode"}
              </h3>
              <button
                onClick={onClose}
                className="p-1 -m-1 touch-manipulation"
                disabled={isLoading}
              >
                <Cross />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <motion.div className="my-4 overflow-hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="304"
                    height="7"
                    viewBox="0 0 304 7"
                    fill="none"
                  >
                    <path
                      d="M1 1L7.29164 4.49999C11.2038 6.67629 15.9628 6.6763 19.875 4.5V4.5C23.7871 2.3237 28.5462 2.3237 32.4583 4.5V4.5C36.3705 6.67629 41.1295 6.6763 45.0416 4.5V4.5C48.9538 2.3237 53.7128 2.3237 57.625 4.5V4.5C61.5371 6.6763 66.2961 6.6763 70.2083 4.5V4.5C74.1204 2.3237 78.8795 2.3237 82.7916 4.5V4.5C86.7038 6.6763 91.4628 6.6763 95.375 4.5V4.5C99.2871 2.3237 104.046 2.3237 107.958 4.5V4.5C111.87 6.6763 116.629 6.6763 120.542 4.5V4.5C124.454 2.3237 129.213 2.3237 133.125 4.5V4.5C137.037 6.6763 141.796 6.6763 145.708 4.5V4.5C149.62 2.3237 154.379 2.3237 158.292 4.5V4.5C162.204 6.6763 166.963 6.6763 170.875 4.5V4.5C174.787 2.3237 179.546 2.3237 183.458 4.5V4.5C187.37 6.6763 192.129 6.6763 196.042 4.5V4.5C199.954 2.3237 204.713 2.3237 208.625 4.5V4.5C212.537 6.6763 217.296 6.6763 221.208 4.5V4.5C225.12 2.3237 229.879 2.3237 233.792 4.5V4.5C237.704 6.6763 242.463 6.6763 246.375 4.5V4.5C250.287 2.3237 255.046 2.3237 258.958 4.5V4.5C262.87 6.6763 267.63 6.6763 271.542 4.5V4.5C275.454 2.3237 280.213 2.3237 284.125 4.5V4.5C288.037 6.6763 292.796 6.6763 296.708 4.5L303 1"
                      stroke="#E2E2E4"
                    />
                  </svg>
                </motion.div>
                <div>
                  <Toggle
                    label="Cast Retweets"
                    description="Include retweets in automatic casting"
                    checked={castRetweets}
                    onChange={setCastRetweets}
                    disabled={isLoading}
                  />

                  <Toggle
                    label="Cast Quote Tweets"
                    description="Include quote tweets in automatic casting"
                    checked={castQuoteTweets}
                    onChange={setCastQuoteTweets}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                {isConfiguring ? "Save Settings" : "Enable YOLO Mode"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
