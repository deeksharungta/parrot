import React from "react";
import Image from "next/image";
import Cross from "../icons/Cross";
import Button from "../ui/Button";

interface PromotionalCastProps {
  onClose: () => void;
}

export default function PromotionalCast({ onClose }: PromotionalCastProps) {
  return (
    <div className="fixed bg-white border border-[#ECECED] z-50 max-h-[85vh] overflow-y-auto bottom-2 left-2 right-2 rounded-[32px] p-6">
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
            value="🚀 Exciting news! We're launching our new casting feature. Share your thoughts with the world and connect with your community like never before! #NewFeature #Casting"
            className="w-full p-3 rounded-xl resize-none focus:outline-none focus:border-transparent bg-[#f8f8f8] text-sm leading-relaxed touch-manipulation"
            rows={4}
            maxLength={280}
            readOnly
          />
        </div>

        <div className="mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative group">
              <Image
                src="/hero.png"
                alt="Promotional image 1"
                width={100}
                height={100}
                className="rounded-lg object-cover w-full h-24"
              />
            </div>
            <div className="relative group">
              <Image
                src="/screenshot.png"
                alt="Promotional image 2"
                width={100}
                height={100}
                className="rounded-lg object-cover w-full h-24"
              />
            </div>
          </div>
        </div>
        <Button>Cast</Button>
      </div>
    </div>
  );
}
