import React from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useGetUser, useUpdateUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Loader2 } from "lucide-react";

export default function YoloMode() {
  const { context } = useMiniKit();
  const { data: userData } = useGetUser(context?.user?.fid);
  const updateUser = useUpdateUser();

  const handleToggleYoloMode = () => {
    if (!context?.user?.fid || !userData?.user) return;

    updateUser.mutate({
      farcaster_fid: context.user.fid,
      yolo_mode: !userData.user.yolo_mode, // Toggle yolo mode
    });
  };

  const isYoloModeEnabled = userData?.user?.yolo_mode ?? false;

  return (
    <Container
      title="Yolo Mode"
      description="Automatically cast all new tweets without approval. You'll be charged 0.1 USDC per cast."
    >
      <Button
        disabled={!userData?.user?.neynar_signer_uuid || updateUser.isPending}
        onClick={handleToggleYoloMode}
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
  );
}
