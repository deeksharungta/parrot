import Image from "next/image";
import React, { useState } from "react";
import { restoreRejectedTweets } from "@/lib/client-tweets-service";
import { toast } from "sonner";
import Button from "../ui/Button";

interface NoTweetsFoundProps {
  onRefresh?: () => void | Promise<void>;
}

export default function NoTweetsFound({ onRefresh }: NoTweetsFoundProps) {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreRejected = async () => {
    setIsRestoring(true);
    try {
      console.log("🔄 Starting restore rejected tweets...");
      const result = await restoreRejectedTweets();
      console.log("📋 Restore result:", result);

      if (result.success) {
        if (result.restoredCount > 0) {
          console.log(
            `✅ Successfully restored ${result.restoredCount} tweets, refreshing...`,
          );

          // Force refresh the tweets data
          if (onRefresh) {
            console.log("🔄 Calling onRefresh...");
            await onRefresh();
            console.log("✅ onRefresh completed");
          } else {
            console.warn("⚠️ onRefresh is not available");
          }
        } else {
          console.log("No rejected tweets found to restore");
        }
      } else {
        console.log(result.message || "Failed to restore rejected tweets");
        console.error(result.error);
      }
    } catch (error) {
      console.error("Error restoring rejected tweets:", error);
      toast.error("Failed to restore rejected tweets");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full border border-[#ECECED] rounded-3xl p-6 gap-4">
      <Image src="/cross.png" alt="cross" width={56} height={56} />
      <p className="text-sm text-[#494656] text-center">
        No new tweets to cast. Go stir things up on the blue bird and come back!
      </p>
      <Button onClick={handleRestoreRejected} disabled={isRestoring}>
        {isRestoring ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          "Show Again"
        )}
      </Button>
    </div>
  );
}
