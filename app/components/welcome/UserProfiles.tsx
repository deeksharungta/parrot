import React from "react";
import Button from "../ui/Button";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGetTwitterAccount } from "@/hooks/useGetTwitterAccount";

const SkeletonLoader = ({ width = "w-16" }: { width?: string }) => (
  <div className={`h-4 ${width} bg-gray-200 rounded animate-pulse`} />
);

export default function UserProfiles() {
  const { context } = useMiniKit();
  const { twitterAccount, isLoading, isError } = useGetTwitterAccount(
    context?.user?.fid,
  );

  return (
    <div className="flex flex-col items-center justify-center w-full px-6 py-8 bg-white border-t border-[#ECECED] absolute bottom-0 left-0 right-0">
      <div className="flex justify-between items-center w-full mb-2.5">
        <div className="flex items-center gap-1">
          <Image
            src="/farcaster.png"
            alt="farcaster"
            width={20}
            height={20}
            className="aspect-square rounded"
          />
          <p className="text-sm font-normal text-[#8C8A94]">
            @{context?.user?.username}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Image
            src="/twitter.png"
            alt="twitter"
            width={20}
            height={20}
            className="aspect-square rounded"
          />
          {isLoading ? (
            <SkeletonLoader width="w-20" />
          ) : isError ? (
            <p className="text-sm font-normal text-red-500">Error loading</p>
          ) : (
            <p className="text-sm font-normal text-[#8C8A94]">
              @{twitterAccount?.username}
            </p>
          )}
        </div>
      </div>
      <Button disabled={isLoading}>
        {isLoading ? "Loading..." : "Continue fetching tweets"}
      </Button>
    </div>
  );
}
