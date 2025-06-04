"use client";
import React, { useState, useRef } from "react";
import TweetCard from "./TweetCard";
import Cross from "../icons/Cross";
import Edit from "../icons/Edit";
import ArrowRight from "../icons/ArrowRight";
import { EditModal } from "./EditModal";
import { useTweet } from "react-tweet";
import NoTweetsFound from "./NoTweetsFound";
import { sdk } from "@farcaster/frame-sdk";

// Dummy tweet data
const dummyTweetIds = [
  "1929987407446978649",
  "1928445938827219370",
  "1928155639487906223",
  "1928145819137421703",
  "1928143197605085622",
  "1927988876712255827",
  "1927604837031538934",
  "1927459285245820961",
  "1927433206820753676",
  "1927429740605985000",
  "1926930088563536109",
];

export default function Tweets() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "up" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: currentTweetData } = useTweet(dummyTweetIds[currentIndex]);

  const SWIPE_THRESHOLD = 100;
  const MAX_ROTATION = 15;

  const handleReject = async () => {
    await sdk.haptics.impactOccurred("medium");
    console.log("Tweet rejected:", dummyTweetIds[currentIndex]);
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
    console.log("Edit tweet:", dummyTweetIds[currentIndex]);
    setShowEditModal(true);
  };

  const handleApprove = async () => {
    await sdk.haptics.impactOccurred("medium");
    await sdk.haptics.notificationOccurred("success");
    console.log("Tweet approved:", dummyTweetIds[currentIndex]);
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
        // Swiped right - approve
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
  const handleEditSave = async (editedContent: string) => {
    setIsEditLoading(true);
    try {
      // Here you would typically save the edited content
      console.log("Saving edited content:", editedContent);

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

  const currentTweet = dummyTweetIds[currentIndex];

  // Check if all tweets are finished
  const allTweetsFinished = currentIndex >= dummyTweetIds.length;

  // Calculate transform values for drag effect
  const rotationX =
    typeof window !== "undefined"
      ? (dragOffset.x / window.innerWidth) * MAX_ROTATION
      : 0;
  const opacity = isDragging
    ? Math.max(0.7, 1 - Math.abs(dragOffset.x + dragOffset.y) / 300)
    : 1;

  // Create a mock tweet object for the EditModal (since we need to adapt the data structure)
  const mockTweetForEdit = currentTweetData
    ? {
        id: currentTweetData.id_str,
        content: currentTweetData.text || "",
        twitter_created_at: currentTweetData.created_at,
        twitter_url: `https://twitter.com/${currentTweetData.user.screen_name}/status/${currentTweetData.id_str}`,
        cast_status: "pending" as const,
        is_edited: false,
      }
    : null;

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
          currentIndex < dummyTweetIds.length - 1 && (
            <div className="absolute inset-0 z-10">
              <TweetCard tweetId={dummyTweetIds[currentIndex + 1]} />
            </div>
          )}

        {!isAnimating && (
          <div
            className="absolute inset-0 z-20"
            style={{
              transform:
                isDragging && Math.abs(dragOffset.x) > Math.abs(dragOffset.y)
                  ? `translateX(${dragOffset.x}px) rotateZ(${rotationX}deg)`
                  : swipeDirection === "left"
                    ? "translateX(-100%) rotate(-30deg)"
                    : swipeDirection === "right"
                      ? "translateX(100%) rotate(30deg)"
                      : "translateX(0) translateY(0) rotate(0deg)",
              opacity:
                isDragging && Math.abs(dragOffset.x) > Math.abs(dragOffset.y)
                  ? opacity
                  : swipeDirection
                    ? 0
                    : 1,
              transition: isDragging ? "none" : "all 150ms ease-out",
            }}
          >
            <TweetCard tweetId={currentTweet} />
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
        <span className="text-[#8C8A94]">{dummyTweetIds.length}</span>
      </p>

      {/* Edit Modal */}
      {mockTweetForEdit && (
        <EditModal
          tweet={mockTweetForEdit}
          onSave={handleEditSave}
          onClose={handleEditClose}
          isLoading={isEditLoading}
          isOpen={showEditModal}
        />
      )}
    </div>
  );
}
