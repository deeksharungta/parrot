"use client";

import React, { useState, useRef } from "react";
import TweetCard from "./TweetCard";
import Cross from "../icons/Cross";
import Edit from "../icons/Edit";
import ArrowRight from "../icons/ArrowRight";
import { EditModal } from "./EditModal";
import { ConnectNeynar } from "./ConnectNeynar";
import { ApproveSpending } from "./ApproveSpending";
import NoTweetsFound from "./NoTweetsFound";
import { sdk } from "@farcaster/frame-sdk";
import { useUserTweets } from "@/hooks/useUserTweets";
import { useGetUser } from "@/hooks/useUsers";
import { useUSDCApproval } from "@/hooks/useUSDCApproval";

interface TweetsProps {
  fid: number;
}

export default function Tweets({ fid }: TweetsProps) {
  // Fetch user tweets using the new caching hook
  const {
    tweets,
    tweetsData,
    isLoading,
    isLoadingFresh,
    error,
    isError,
    hasNewTweets,
    refreshTweets,
    updateTweetStatus: updateTweetStatusHandler,
  } = useUserTweets(fid);

  const showTweets = tweets?.slice(0, 10) || [];

  // Fetch user data to check for signer_uuid and allowance
  const { data: userData } = useGetUser(fid);
  const { hasAllowance } = useUSDCApproval();
  const hasSignerUuid = userData?.user?.neynar_signer_uuid;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "up" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConnectNeynar, setShowConnectNeynar] = useState(false);
  const [showApproveSpending, setShowApproveSpending] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;
  const MAX_ROTATION = 15;

  // Determine if this is a first-time user
  const isFirstTimeUser = showTweets.length === 0 && !isLoading && !isError;

  // Handle loading and error states
  if (isLoading || (isFirstTimeUser && isLoadingFresh)) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-center">
          {/* Loading spinner */}
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 text-sm">Loading tweets...</p>
        </div>
      </div>
    );
  }

  // Show error only when there's an actual error, not when no tweets are found
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load tweets
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {error?.message || "Something went wrong while loading tweets"}
          </p>
          <button
            onClick={refreshTweets}
            className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
          >
            Tap to refresh
          </button>
        </div>
      </div>
    );
  }

  // Show NoTweetsFound when no tweets are available (but no error occurred)
  if (!isLoading && !isLoadingFresh && showTweets.length === 0) {
    return <NoTweetsFound />;
  }

  const handleReject = async () => {
    await sdk.haptics.impactOccurred("medium");
    const currentTweet = showTweets[currentIndex];
    console.log("Tweet rejected:", currentTweet?.tweet_id);

    // Update tweet status in database
    if (currentTweet?.tweet_id) {
      try {
        await updateTweetStatusHandler(currentTweet.tweet_id, "rejected");
      } catch (error) {
        console.error("Error updating tweet status:", error);
      }
    }

    setSwipeDirection("left");
    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 100);
  };

  const handleEdit = () => {
    const currentTweet = showTweets[currentIndex];
    console.log("Edit tweet:", currentTweet?.tweet_id);

    // Check if user has signer_uuid before opening edit modal
    if (!hasSignerUuid) {
      setShowConnectNeynar(true);
      return;
    }

    // Check if user has allowance
    if (!hasAllowance) {
      setShowApproveSpending(true);
      return;
    }

    setShowEditModal(true);
  };

  const handleApprove = async () => {
    // Check if user has signer_uuid before approving
    if (!hasSignerUuid) {
      setShowConnectNeynar(true);
      return;
    }

    // Check if user has allowance
    if (!hasAllowance) {
      setShowApproveSpending(true);
      return;
    }

    await sdk.haptics.impactOccurred("medium");
    await sdk.haptics.notificationOccurred("success");
    const currentTweet = showTweets[currentIndex];
    console.log("Tweet approved:", currentTweet?.tweet_id);

    // Update tweet status in database
    if (currentTweet?.tweet_id) {
      try {
        await updateTweetStatusHandler(currentTweet.tweet_id, "approved");
      } catch (error) {
        console.error("Error updating tweet status:", error);
      }
    }

    setSwipeDirection("right");
    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 100);
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const diffX = clientX - startPos.x;
    const diffY = clientY - startPos.y;
    setDragOffset({ x: diffX, y: diffY });
  };

  const handleEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absX > SWIPE_THRESHOLD && absX > absY) {
      // Horizontal swipe
      if (dragOffset.x > 0) {
        // Swiped right - approve (check for signer_uuid and allowance)
        handleApprove();
      } else {
        // Swiped left - reject
        handleReject();
      }
    } else if (absY > SWIPE_THRESHOLD && absY > absX) {
      // Vertical swipe
      if (dragOffset.y < 0) {
        // Swiped up - edit (don't move the card, just show modal)
        handleEdit();
      }
      // We don't handle down swipes for now
    }

    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Edit modal handlers
  const handleEditSave = async (
    editedContent: string,
    mediaUrls: string[],
    quotedTweetUrl: string | null,
  ) => {
    setIsEditLoading(true);
    try {
      // Here you would typically save the edited content, media URLs, and quoted tweet URL
      console.log("Saving edited content:", editedContent);
      console.log("Media URLs:", mediaUrls);
      console.log("Quoted tweet URL:", quotedTweetUrl);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Close modal and proceed to next tweet after editing
      setShowEditModal(false);
      setSwipeDirection("right");
      setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setSwipeDirection(null);
          setIsAnimating(false);
        }, 50);
      }, 100);
    } catch (error) {
      console.error("Error saving edited tweet:", error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditClose = () => {
    setShowEditModal(false);
  };

  const handleConnectNeynarClose = () => {
    setShowConnectNeynar(false);
  };

  const handleApproveSpendingClose = () => {
    setShowApproveSpending(false);
  };

  const currentTweet = showTweets[currentIndex];

  // Check if all tweets are finished
  const allTweetsFinished = currentIndex >= showTweets.length;

  // Calculate transform values for drag effect
  // Prevent right swipe animation if no signer_uuid or no allowance
  const shouldPreventRightSwipe =
    (!hasSignerUuid || !hasAllowance) && dragOffset.x > 0;
  const effectiveDragX = shouldPreventRightSwipe ? 0 : dragOffset.x;

  const rotationX =
    typeof window !== "undefined"
      ? (effectiveDragX / window.innerWidth) * MAX_ROTATION
      : 0;
  const opacity = isDragging
    ? Math.max(0.7, 1 - Math.abs(effectiveDragX + dragOffset.y) / 300)
    : 1;

  // If all tweets are finished, show the message
  if (allTweetsFinished) {
    return <NoTweetsFound />;
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        data-theme="light"
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-[calc(100%-20px)] h-full rounded-3xl bg-[#F8F8F8] border border-[#ECECED] absolute -top-4 left-1/2 -translate-x-1/2 z-0" />
        <div className="w-[calc(100%-6px)] h-full rounded-3xl bg-[#F8F8F8] border border-[#ECECED] absolute -top-2 left-1/2 -translate-x-1/2 z-0" />

        {(swipeDirection || isDragging) &&
          currentIndex < showTweets.length - 1 && (
            <div className="absolute inset-0 z-10">
              <TweetCard
                tweetId={showTweets[currentIndex + 1]?.tweet_id || ""}
              />
            </div>
          )}

        {!isAnimating && (
          <div
            className="absolute inset-0 z-20"
            style={{
              transform:
                isDragging && Math.abs(effectiveDragX) > Math.abs(dragOffset.y)
                  ? `translateX(${effectiveDragX}px) rotateZ(${rotationX}deg)`
                  : swipeDirection === "left"
                    ? "translateX(-100%) rotate(-30deg)"
                    : swipeDirection === "right"
                      ? "translateX(100%) rotate(30deg)"
                      : "translateX(0) translateY(0) rotate(0deg)",
              opacity:
                isDragging && Math.abs(effectiveDragX) > Math.abs(dragOffset.y)
                  ? opacity
                  : swipeDirection
                    ? 0
                    : 1,
              transition: isDragging ? "none" : "all 150ms ease-out",
            }}
          >
            <TweetCard tweetId={currentTweet?.tweet_id || ""} />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-10 mt-6 w-full">
        <button
          onClick={handleReject}
          className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors"
        >
          <Cross />
        </button>
        <button
          onClick={handleEdit}
          className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors"
        >
          <Edit />
        </button>
        <button
          onClick={handleApprove}
          className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors"
        >
          <ArrowRight />
        </button>
      </div>

      <p className="text-center text-base font-medium text-[#B3B1B8] mt-3">
        <span className="text-[#8C8A94]">{currentIndex + 1}</span> of{" "}
        <span className="text-[#8C8A94]">{showTweets.length}</span>
      </p>

      {hasNewTweets && (
        <div className="text-center mt-2">
          <button
            onClick={refreshTweets}
            className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
          >
            New tweets available - Tap to refresh
          </button>
        </div>
      )}

      <EditModal
        tweetId={currentTweet?.tweet_id || ""}
        onSave={handleEditSave}
        onClose={handleEditClose}
        isLoading={isEditLoading}
        isOpen={showEditModal}
      />

      <ConnectNeynar
        isOpen={showConnectNeynar}
        onClose={handleConnectNeynarClose}
      />

      <ApproveSpending
        isOpen={showApproveSpending}
        onClose={handleApproveSpendingClose}
      />
    </div>
  );
}
