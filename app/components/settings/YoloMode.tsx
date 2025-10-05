import React, { useState } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useCurrentUser, useUpdateUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Loader2 } from "lucide-react";
import YoloModeModal from "../modals/YoloModeModal";
import { toast } from "sonner";
import Edit from "../icons/Edit";
import { analytics } from "@/lib/analytics";
import ChannelModal from "../cast/ChannelModal";

export default function YoloMode() {
  const { context } = useMiniKit();
  const { data: userData } = useCurrentUser();
  const updateUser = useUpdateUser();
  const [showModal, setShowModal] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConfigureYoloMode = () => {
    analytics.trackModalOpen("yolo_mode_config", "settings_enable_button");
    setIsConfiguring(false); // Enabling YOLO mode for first time
    setShowModal(true);
  };

  const handleReconfigureSettings = () => {
    analytics.trackModalOpen("yolo_mode_config", "settings_edit_button");
    setIsConfiguring(true); // Reconfiguring existing settings
    setShowModal(true);
  };

  const handleDisableYoloMode = () => {
    analytics.trackYoloModeToggle(false);
    updateUser.mutate(
      {
        farcaster_fid: context?.user?.fid ?? 0,
        yolo_mode: false,
      },
      {
        onSuccess: () => {
          toast("YOLO Mode Disabled");
        },
      },
    );
  };

  const handleSaveSettings = (settings: {
    castRetweets: boolean;
    castQuoteTweets: boolean;
    castNormalTweets: boolean;
  }) => {
    if (!context?.user?.fid || !userData?.user) return;

    // If we're configuring (not enabling), only update the preferences
    // If we're enabling, set yolo_mode to true and update preferences
    const updateData = isConfiguring
      ? {
          farcaster_fid: context.user.fid,
          yolo_cast_retweets: settings.castRetweets,
          yolo_cast_quote_tweets: settings.castQuoteTweets,
          yolo_cast_normal_tweets: settings.castNormalTweets,
        }
      : {
          farcaster_fid: context.user.fid,
          yolo_mode: true,
          yolo_cast_retweets: settings.castRetweets,
          yolo_cast_quote_tweets: settings.castQuoteTweets,
          yolo_cast_normal_tweets: settings.castNormalTweets,
        };

    // Track analytics
    if (!isConfiguring) {
      analytics.trackYoloModeToggle(true);
    }

    analytics.trackEvent("yolo_mode_configured", {
      cast_retweets: settings.castRetweets,
      cast_quote_tweets: settings.castQuoteTweets,
      cast_normal_tweets: settings.castNormalTweets,
      is_reconfiguring: isConfiguring,
    });

    updateUser.mutate(updateData, {
      onSuccess: () => {
        setShowModal(false);

        // Show appropriate toast based on action
        if (isConfiguring) {
          toast("YOLO Mode Settings Updated", {
            description: "Your preferences have been saved",
          });
        } else {
          toast("YOLO Mode Enabled!", {
            description: "Tweets will now be auto-casted",
          });
        }
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
      <Container
        title="Yolo Mode"
        description="Automatically cast all new tweets without approval. You'll be charged 0.1 USDC per cast."
        rightIcon={
          isYoloModeEnabled ? (
            <button
              onClick={handleReconfigureSettings}
              className="p-1 -m-1 touch-manipulation flex items-center gap-1"
              disabled={updateUser.isPending}
            >
              <Edit className="w-3.5 h-3.5" />{" "}
              <span className="text-sm font-medium text-[#100C20]">Edit</span>
            </button>
          ) : undefined
        }
      >
        <Button
          disabled={updateUser.isPending}
          onClick={
            isYoloModeEnabled ? handleDisableYoloMode : handleConfigureYoloMode
          }
          variant={isYoloModeEnabled ? "secondary" : "primary"}
        >
          {updateUser.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isYoloModeEnabled ? (
            "Disable YOLO Mode"
          ) : (
            "Enable YOLO Mode"
          )}
        </Button>
        <p className="text-[#8C8A94] text-xs font-normal text-center px-5">
          YOLO mode stops automatically when your allowance runs out. We&apos;ll
          notify you.
        </p>
      </Container>
      <ChannelModal
        channel="Twitter"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isLoading={updateUser.isPending}
      />
      {/* <YoloModeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveSettings}
        isLoading={updateUser.isPending}
        currentSettings={currentSettings}
        isConfiguring={isConfiguring}
      /> */}
    </>
  );
}
