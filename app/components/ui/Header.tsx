"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
// import EarlyAccessModal from "../promotional/EarlyAccessModal";
import Settings from "../icons/Settings";
// import { usePromotionCastCheck } from "@/hooks/usePromotionCast";

export default function Header({ title }: { title: string }) {
  const { context } = useMiniKit();
  // const [earlyAccessModalOpen, setEarlyAccessModalOpen] = useState(false);
  // const { data: promotionCastStatus, isLoading } = usePromotionCastCheck();

  // Don't show the settings button if user has already cast promotional cast
  // const showSettingsButton = !promotionCastStatus?.hasCasted && !isLoading;

  return (
    <>
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 p-5">
        <motion.p
          className="font-medium text-2xl text-[#494656]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {title}
        </motion.p>
        <div className="flex items-center gap-2">
          {/* {showSettingsButton && (
            <button
              onClick={() => {
                setEarlyAccessModalOpen(true);
              }}
            >
              <Settings isActive={false} />
            </button>
          )} */}
          <div className="rounded-full overflow-hidden">
            <Image
              src={context?.user?.pfpUrl ?? "/farcaster.png"}
              alt="profile"
              width={30}
              height={30}
              className="rounded-full"
            />
          </div>
        </div>
      </div>
      {/* {showSettingsButton && (
        <EarlyAccessModal
          isOpen={earlyAccessModalOpen}
          onClose={() => setEarlyAccessModalOpen(false)}
        />
      )} */}
    </>
  );
}
