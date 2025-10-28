"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
// import EarlyAccessModal from "../promotional/EarlyAccessModal";
import Settings from "../icons/Settings";
// import { usePromotionCastCheck } from "@/hooks/usePromotionCast";
import { useCurrentUser, useUpdateUser } from "@/hooks/useUsers";
import YoloModeModal from "../modals/YoloModeModal";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useRouter } from "next/navigation";

export default function Header({ title }: { title: string }) {
  const { context } = useMiniKit();
  const { data: userData } = useCurrentUser();
  const updateUser = useUpdateUser();
  const router = useRouter();
  const [yoloModeModalOpen, setYoloModeModalOpen] = useState(false);
  // const [earlyAccessModalOpen, setEarlyAccessModalOpen] = useState(false);
  // const { data: promotionCastStatus, isLoading } = usePromotionCastCheck();

  // Don't show the settings button if user has already cast promotional cast
  // const showSettingsButton = !promotionCastStatus?.hasCasted && !isLoading;

  const handleEnableAutoPost = () => {
    analytics.trackModalOpen("yolo_mode_config", "header_enable_button");
    setYoloModeModalOpen(true);
  };

  const handleDisableAutoPost = () => {
    router.push("/settings");
  };

  const handleSaveYoloModeSettings = (settings: {
    castRetweets: boolean;
    castQuoteTweets: boolean;
    castNormalTweets: boolean;
  }) => {
    if (!context?.user?.fid || !userData?.user) return;

    const updateData = {
      farcaster_fid: context.user.fid,
      yolo_mode: true,
      yolo_cast_retweets: settings.castRetweets,
      yolo_cast_quote_tweets: settings.castQuoteTweets,
      yolo_cast_normal_tweets: settings.castNormalTweets,
    };

    // Track analytics
    analytics.trackYoloModeToggle(true);
    analytics.trackEvent("yolo_mode_configured", {
      cast_retweets: settings.castRetweets,
      cast_quote_tweets: settings.castQuoteTweets,
      cast_normal_tweets: settings.castNormalTweets,
      is_reconfiguring: false,
    });

    updateUser.mutate(updateData, {
      onSuccess: () => {
        setYoloModeModalOpen(false);
        toast("YOLO Mode Enabled!", {
          description: "Tweets will now be auto-casted",
        });
      },
    });
  };

  const isYoloModeEnabled = userData?.user?.yolo_mode ?? false;
  const currentSettings = {
    castRetweets: userData?.user?.yolo_cast_retweets ?? true,
    castQuoteTweets: userData?.user?.yolo_cast_quote_tweets ?? true,
    castNormalTweets: userData?.user?.yolo_cast_normal_tweets ?? true,
  };

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

          {title === "Pick and Cast" && (
            <button
              onClick={
                isYoloModeEnabled ? handleDisableAutoPost : handleEnableAutoPost
              }
              className={`text-white text-sm py-1 px-3 rounded-xl bg-black whitespace-nowrap ${isYoloModeEnabled ? "bg-[#0ED065]" : "bg-black"}`}
              disabled={updateUser.isPending}
            >
              {isYoloModeEnabled ? "Auto-post enabled" : "Enable auto-post"}
            </button>
          )}
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
      <YoloModeModal
        isOpen={yoloModeModalOpen}
        onClose={() => setYoloModeModalOpen(false)}
        onSave={handleSaveYoloModeSettings}
        isLoading={updateUser.isPending}
        currentSettings={currentSettings}
        isConfiguring={false}
      />
    </>
  );
}
