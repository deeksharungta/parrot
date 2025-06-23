"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import Image from "next/image";
import Cross from "../icons/Cross";
import Button from "../ui/Button";
import { usePromotionCast } from "@/hooks/usePromotionCast";

interface PromotionalCastProps {
  onClose: () => void;
}

export default function PromotionalCast({ onClose }: PromotionalCastProps) {
  const promotionCast = usePromotionCast();

  const [castText, setCastText] = useState(
    "🚀 Exciting news! We're launching our new casting feature. Share your thoughts with the world and connect with your community like never before! #NewFeature #Casting",
  );

  const [showImage, setShowImage] = useState(true);

  const handleCast = () => {
    // Convert images to embeds
    const embeds = showImage ? ["https://parrot.click"] : [];

    promotionCast.mutate(
      {
        text: castText,
        embeds: embeds,
      },
      {
        onSuccess: () => {
          // Close modal on successful cast
          onClose();
        },
      },
    );
  };

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
        className="fixed bottom-2 left-2 right-2 bg-white rounded-[32px] border border-[#ECECED] z-50 max-h-[80vh] overflow-hidden p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#100c20] text-base">
            Confirm your Cast
          </h3>
          <button className="p-1 -m-1 touch-manipulation" onClick={onClose}>
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

        <div>
          <div className="relative">
            <textarea
              value={castText}
              onChange={(e) => setCastText(e.target.value)}
              className="w-full p-3 rounded-xl resize-none focus:outline-none focus:border-transparent bg-[#f8f8f8] text-sm leading-relaxed touch-manipulation"
              rows={4}
              maxLength={280}
              placeholder="What's on your mind?"
            />
          </div>

          {showImage && (
            <div className="mt-3">
              <div className="relative group">
                <Image
                  src="/hero.png"
                  alt="Promotional hero image"
                  width={400}
                  height={200}
                  className="rounded-lg object-cover w-full h-32"
                />
                <button
                  onClick={() => setShowImage(false)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 transition-colors touch-manipulation"
                >
                  <Cross className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          <Button onClick={handleCast} disabled={promotionCast.isPending}>
            {promotionCast.isPending ? "Casting..." : "Cast"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
