"use client";

import React, { useState, useRef } from "react";
import TweetCard from "./TweetCard";
import Cross from "../icons/Cross";
import Edit from "../icons/Edit";
import ArrowRight from "../icons/ArrowRight";
import { EditModal, shouldShowCastConfirmation } from "./EditModal";
import { ConnectNeynar } from "./ConnectNeynar";
import { ApproveSpending } from "./ApproveSpending";
import NoTweetsFound from "./NoTweetsFound";
import { sdk } from "@farcaster/frame-sdk";
import { useUserTweets } from "@/hooks/useUserTweets";
import { useGetUser } from "@/hooks/useUsers";
import { useUSDCApproval } from "@/hooks/useUSDCApproval";
import { useEditTweet, useCastTweet } from "@/hooks/useTweetEdit";
import { useCastThread } from "@/hooks/useThreads";
import { useFreeCasts } from "@/hooks/useFreeCasts";
import ThreadTweetCard from "./ThreadTweetCard";
import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { USDC_ADDRESS } from "@/lib/constants";
import { toast } from "sonner";
import { Database } from "@/lib/types/database";
import { analytics } from "@/lib/analytics";

type TweetType = Database["public"]["Tables"]["tweets"]["Row"];

interface RetweetInfo {
  retweetedBy: {
    name: string;
    username: string;
    profileImageUrl: string;
    isVerified: boolean;
  };
  retweetedAt: string;
}

interface TweetsProps {
  fid: number;
}

// Add constants for casting costs
const CAST_COST = 0.1; // USDC cost per cast
const MIN_ALLOWANCE = 0.1; // Minimum allowance required in USDC

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
    forceRefreshTweets,
    updateTweetStatus: updateTweetStatusHandler,
  } = useUserTweets(fid);

  // console.log("tweets", tweets);

  // Keep the original tweets array stable during the swiping session
  const [stableTweets, setStableTweets] = useState<any[]>([]);
  const [processedTweetIds, setProcessedTweetIds] = useState<Set<string>>(
    new Set(),
  );
  const [previousTweetCount, setPreviousTweetCount] = useState<number>(0);

  // Update stable tweets when new tweets are loaded
  React.useEffect(() => {
    if (tweets && tweets.length > 0) {
      // Filter to only show thread starters or non-thread tweets, and exclude videos/GIFs
      const filteredTweets = tweets.filter((tweet) => {
        // Show non-thread tweets
        if (!tweet.is_thread_tweet) {
          return true;
        }

        // For thread tweets, only show if it's position 1 or thread start
        if (tweet.is_thread_start || tweet.thread_position === 1) {
          return true;
        }

        return false;
      });

      // Only update stable tweets if:
      // 1. We don't have any stable tweets yet (initial load)
      // 2. We have significantly more tweets than before (indicating a refetch/restore)
      const isInitialLoad = stableTweets.length === 0;
      const isRefetch = tweets.length > previousTweetCount + 5; // Significant increase indicates refetch

      if (isInitialLoad) {
        setStableTweets(filteredTweets);
        setCurrentIndex(0);
      } else if (isRefetch) {
        setStableTweets(filteredTweets);
        setCurrentIndex(0); // Reset to beginning after refetch
      }

      // Update previous count for next comparison
      setPreviousTweetCount(tweets.length);
    } else if (tweets && tweets.length === 0) {
      // No tweets available
      setStableTweets([]);
      setCurrentIndex(0);
      setPreviousTweetCount(0);
    }
  }, [tweets, stableTweets.length]);

  const showTweets = stableTweets;

  // Fetch user data to check for signer_uuid, allowance, and balance
  const { data: userData } = useGetUser(fid);
  const { hasAllowance, currentAllowance } = useUSDCApproval();
  const { data: freeCastsData } = useFreeCasts();
  const hasSignerUuid = userData?.user?.neynar_signer_uuid;
  const userWalletAddress = userData?.user?.wallet_address;

  // Check USDC balance onchain
  const { data: onchainBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userWalletAddress ? [userWalletAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userWalletAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Helper function to check if user has free casts remaining
  const hasFreeCasts = () => {
    return freeCastsData?.freeCastsLeft && freeCastsData.freeCastsLeft > 0;
  };

  // Helper function to check if user has sufficient balance (onchain)
  const hasSufficientBalance = () => {
    if (!onchainBalance) return false;
    // Convert bigint to number for comparison (6 decimals for USDC)
    const balanceInUSDC = Number(formatUnits(onchainBalance, 6));
    return balanceInUSDC >= CAST_COST;
  };

  // Helper function to check if user has sufficient allowance (onchain)
  const hasSufficientAllowance = () => {
    if (!hasAllowance || !currentAllowance) return false;
    // Convert bigint to number for comparison (6 decimals for USDC)
    const allowanceInUSDC = Number(formatUnits(currentAllowance, 6));
    return allowanceInUSDC >= MIN_ALLOWANCE;
  };

  // Helper function to check if tweet contains video or GIF
  const hasVideoOrGif = (tweet: any) => {
    // Return false if tweet doesn't have media_urls or it's not an object
    if (!tweet?.media_urls || typeof tweet.media_urls !== "object") {
      return false;
    }

    const hasVideo =
      tweet.media_urls.videos &&
      Array.isArray(tweet.media_urls.videos) &&
      tweet.media_urls.videos.length > 0;

    const hasGif =
      tweet.media_urls.types &&
      Array.isArray(tweet.media_urls.types) &&
      tweet.media_urls.types.includes("animated_gif");

    return hasVideo || hasGif;
  };

  // Helper function to check all prerequisites for casting
  const canCast = () => {
    return (
      hasSignerUuid &&
      userData?.user?.signer_approval_status === "approved" &&
      (hasFreeCasts() || (hasSufficientAllowance() && hasSufficientBalance()))
    );
  };

  // Get formatted balance for debugging/display
  const formattedBalance = onchainBalance
    ? formatUnits(onchainBalance, 6)
    : "0";
  const formattedAllowance = currentAllowance
    ? formatUnits(currentAllowance, 6)
    : "0";

  // Helper function to create retweet info from available data
  const createRetweetInfo = (tweet: any): RetweetInfo | undefined => {
    if (!tweet?.is_retweet) return undefined;

    // Use the saved Twitter user data from the database
    return {
      retweetedBy: {
        name:
          tweet.twitter_display_name ||
          tweet.twitter_username ||
          "Unknown User",
        username: tweet.twitter_username || "unknown",
        profileImageUrl:
          tweet.profile_image_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.twitter_username || "default"}`,
        isVerified: tweet.is_blue_tick_verified || false,
      },
      retweetedAt: tweet.twitter_created_at || tweet.created_at,
    };
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "up" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConnectNeynar, setShowConnectNeynar] = useState(false);
  const [showApproveSpending, setShowApproveSpending] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isCastLoading, setIsCastLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // New hooks for editing and casting
  const editTweetMutation = useEditTweet();
  const castTweetMutation = useCastTweet();
  const castThreadMutation = useCastThread();

  const SWIPE_THRESHOLD = 100;
  const MAX_ROTATION = 15;

  // Determine if this is a first-time user
  const isFirstTimeUser = showTweets.length === 0 && !isLoading && !isError;

  // console.log("showTweets", showTweets);

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
    return <NoTweetsFound onRefresh={forceRefreshTweets} />;
  }

  const handleReject = async () => {
    await sdk.haptics.impactOccurred("medium");
    const currentTweet = showTweets[currentIndex];

    // Track this tweet as processed
    if (currentTweet?.tweet_id) {
      setProcessedTweetIds((prev) => new Set(prev).add(currentTweet.tweet_id));
    }

    // Move to next tweet immediately for better UX
    setSwipeDirection("left");
    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 100);

    // Update tweet status in database asynchronously to avoid reloading
    if (currentTweet?.tweet_id) {
      try {
        // Don't await this to prevent blocking the UI transition
        updateTweetStatusHandler(currentTweet.tweet_id, "rejected").catch(
          (error) => {
            console.error("Error updating tweet status:", error);
          },
        );
      } catch (error) {
        console.error("Error updating tweet status:", error);
      }
    }
  };

  const handleEdit = () => {
    const currentTweet = showTweets[currentIndex];

    // Check if tweet contains video or GIF - prevent editing
    if (hasVideoOrGif(currentTweet)) {
      return;
    }

    // Check if user has signer_uuid before opening edit modal
    if (
      !hasSignerUuid ||
      userData?.user?.signer_approval_status !== "approved"
    ) {
      setShowConnectNeynar(true);
      return;
    }

    // Check if user has free casts first - if they do, skip allowance/balance checks
    if (!hasFreeCasts()) {
      // Check if user has sufficient allowance
      if (!hasSufficientAllowance()) {
        toast("Insufficient allowance");
        setShowApproveSpending(true);
        return;
      }

      // Check if user has sufficient balance
      if (!hasSufficientBalance()) {
        toast("Insufficient balance");
        setShowApproveSpending(true);
        return;
      }
    }

    setShowEditModal(true);
  };

  const handleApprove = async () => {
    // Check if user has signer_uuid before approving
    if (
      !hasSignerUuid ||
      userData?.user?.signer_approval_status !== "approved"
    ) {
      setShowConnectNeynar(true);
      return;
    }

    // Check if user has free casts first - if they do, skip allowance/balance checks
    if (!hasFreeCasts()) {
      // Check if user has sufficient allowance
      if (!hasSufficientAllowance()) {
        toast("Insufficient allowance");
        setShowApproveSpending(true);
        return;
      }

      // Check if user has sufficient balance
      if (!hasSufficientBalance()) {
        toast("Insufficient balance");
        setShowApproveSpending(true);
        return;
      }
    }

    await sdk.haptics.impactOccurred("medium");
    const currentTweet = showTweets[currentIndex];

    // Check if confirmation should be shown
    if (shouldShowCastConfirmation()) {
      setShowConfirmModal(true);
      return;
    }

    // If no confirmation needed, proceed directly with casting
    handleDirectCast();
  };

  const handleDirectCast = async () => {
    const currentTweet = showTweets[currentIndex];

    // Track this tweet as processed
    if (currentTweet?.tweet_id) {
      setProcessedTweetIds((prev) => new Set(prev).add(currentTweet.tweet_id));
    }

    // Show swipe animation and move to next tweet immediately
    setSwipeDirection("right");
    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 100);

    // Cast the tweet or thread in the background
    if (currentTweet?.tweet_id && userData?.user?.neynar_signer_uuid) {
      // Show loading toast
      toast(
        <div className="flex items-center justify-center gap-2 w-full h-full">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Casting...</span>
        </div>,
        { duration: Infinity },
      );

      // Check if this is a thread tweet
      if (currentTweet.is_thread_tweet && currentTweet.conversation_id) {
        // Cast entire thread
        castThreadMutation.mutate(
          {
            conversationId: currentTweet.conversation_id,
          },
          {
            onSuccess: async () => {
              await sdk.haptics.notificationOccurred("success");
            },
            onError: async (error) => {
              console.error("Error casting thread:", error);
              await sdk.haptics.notificationOccurred("error");
            },
          },
        );
      } else {
        // Cast single tweet
        castTweetMutation.mutate(
          {
            tweetId: currentTweet.tweet_id,
            content: currentTweet.content || "",
          },
          {
            onSuccess: async () => {
              await sdk.haptics.notificationOccurred("success");
            },
            onError: async (error) => {
              console.error("Error casting tweet:", error);
              await sdk.haptics.notificationOccurred("error");
            },
          },
        );
      }
    }
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
    mediaUrls: Array<{ url: string; type: string }>,
    quotedTweetUrl: string | null,
    isRetweetRemoved: boolean,
    videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>,
    threadTweets?: Array<{
      tweetId: string;
      content: string;
      mediaUrls: Array<{ url: string; type: string }>;
      videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
      isRetweetRemoved: boolean;
    }>,
  ) => {
    setIsEditLoading(true);
    const currentTweet = showTweets[currentIndex];

    try {
      if (!currentTweet?.tweet_id) {
        throw new Error("No tweet ID available");
      }

      // Step 1: Save edited content to database
      if (threadTweets && threadTweets.length > 0) {
        // Handle thread editing - save all thread tweets
        for (const threadTweet of threadTweets) {
          await editTweetMutation.mutateAsync({
            tweetId: threadTweet.tweetId,
            content: threadTweet.content,
            mediaUrls: threadTweet.mediaUrls,
            quotedTweetUrl: null, // Thread tweets typically don't have quoted tweets
            isRetweetRemoved: threadTweet.isRetweetRemoved,
            videoUrls: threadTweet.videoUrls,
          });
        }
      } else {
        // Handle single tweet editing
        await editTweetMutation.mutateAsync({
          tweetId: currentTweet.tweet_id,
          content: editedContent,
          mediaUrls: mediaUrls,
          quotedTweetUrl: quotedTweetUrl,
          isRetweetRemoved: isRetweetRemoved,
          videoUrls: videoUrls,
        });
      }

      // Step 2: Cast the edited tweet or thread to Farcaster
      if (userData?.user?.neynar_signer_uuid) {
        // Show loading toast
        toast(
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Casting...</span>
          </div>,
          { duration: Infinity },
        );

        // Check if this is a thread tweet
        if (currentTweet.is_thread_tweet && currentTweet.conversation_id) {
          // Cast entire thread (note: for threads, we cast the whole thread, not just the edited tweet)
          await castThreadMutation.mutateAsync({
            conversationId: currentTweet.conversation_id,
          });
        } else {
          // Cast single edited tweet
          await castTweetMutation.mutateAsync({
            tweetId: currentTweet.tweet_id,
            content: editedContent,
            mediaUrls: mediaUrls,
            quotedTweetUrl: quotedTweetUrl,
            isRetweetRemoved: isRetweetRemoved,
            videoUrls: videoUrls,
            isEdit: true,
          });
        }

        setShowEditModal(false);
      } else {
        throw new Error("Signer UUID not available");
      }

      // Track this tweet as processed
      if (currentTweet?.tweet_id) {
        setProcessedTweetIds((prev) =>
          new Set(prev).add(currentTweet.tweet_id),
        );
      }

      // Close modal and proceed to next tweet after successful edit + cast
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
      console.error("Error in edit + cast flow:", error);
      // Keep modal open on error so user can retry
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditClose = () => {
    analytics.trackModalClose("edit_tweet", "cancel");
    setShowEditModal(false);
  };

  const handleConnectNeynarClose = () => {
    setShowConnectNeynar(false);
  };

  const handleApproveSpendingClose = () => {
    setShowApproveSpending(false);
  };

  const handleConfirmSave = async (
    content: string,
    mediaUrls: Array<{ url: string; type: string }>,
    quotedTweetUrl: string | null,
    isRetweetRemoved: boolean,
    videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>,
    threadTweets?: Array<{
      tweetId: string;
      content: string;
      mediaUrls: Array<{ url: string; type: string }>;
      videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
      isRetweetRemoved: boolean;
    }>,
  ) => {
    setIsCastLoading(true);
    const currentTweet = showTweets[currentIndex];

    try {
      if (!currentTweet?.tweet_id) {
        throw new Error("No tweet ID available");
      }

      // If content was edited, save the changes first
      if (threadTweets && threadTweets.length > 0) {
        // Handle thread editing - save all thread tweets that were modified
        for (const threadTweet of threadTweets) {
          // Check if content was actually edited by comparing with original
          // For now, we'll save all tweets in the thread that have content
          if (threadTweet.content.length > 0) {
            await editTweetMutation.mutateAsync({
              tweetId: threadTweet.tweetId,
              content: threadTweet.content,
              mediaUrls: threadTweet.mediaUrls,
              quotedTweetUrl: null, // Thread tweets typically don't have quoted tweets
              isRetweetRemoved: threadTweet.isRetweetRemoved,
              videoUrls: threadTweet.videoUrls,
            });
          }
        }
      } else {
        // Handle single tweet - check if content was edited
        const isContentEdited =
          content !==
          (currentTweet.content || currentTweet.original_content || "");
        if (isContentEdited) {
          await editTweetMutation.mutateAsync({
            tweetId: currentTweet.tweet_id,
            content: content,
            mediaUrls: mediaUrls,
            quotedTweetUrl: quotedTweetUrl,
            isRetweetRemoved: isRetweetRemoved,
            videoUrls: videoUrls,
          });
        }
      }

      // Cast the tweet or thread to Farcaster
      if (userData?.user?.neynar_signer_uuid) {
        // Show loading toast
        toast(
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Casting...</span>
          </div>,
          { duration: Infinity },
        );

        // Check if this is a thread tweet
        if (currentTweet.is_thread_tweet && currentTweet.conversation_id) {
          // Cast entire thread
          await castThreadMutation.mutateAsync({
            conversationId: currentTweet.conversation_id,
          });
        } else {
          // Cast single tweet
          await castTweetMutation.mutateAsync({
            tweetId: currentTweet.tweet_id,
            content: content,
            mediaUrls: mediaUrls,
            quotedTweetUrl: quotedTweetUrl,
            isRetweetRemoved: isRetweetRemoved,
            videoUrls: videoUrls,
            isEdit: threadTweets
              ? false
              : content !==
                (currentTweet.content || currentTweet.original_content || ""),
          });
        }

        await sdk.haptics.notificationOccurred("success");
      } else {
        throw new Error("Signer UUID not available");
      }

      // Track this tweet as processed
      if (currentTweet?.tweet_id) {
        setProcessedTweetIds((prev) =>
          new Set(prev).add(currentTweet.tweet_id),
        );
      }

      // Close modal and proceed to next tweet after successful cast
      setShowConfirmModal(false);
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
      console.error("Error in confirm + cast flow:", error);
      await sdk.haptics.notificationOccurred("error");
      // Keep modal open on error so user can retry
    } finally {
      setIsCastLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
  };

  const currentTweet = showTweets[currentIndex];

  // Check if all tweets are finished
  const allTweetsFinished = currentIndex >= showTweets.length;

  // Calculate transform values for drag effect
  // Prevent right swipe animation if prerequisites are not met
  const shouldPreventRightSwipe = !canCast() && dragOffset.x > 0;
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
    return <NoTweetsFound onRefresh={forceRefreshTweets} />;
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
              {showTweets[currentIndex + 1]?.is_thread_tweet &&
              showTweets[currentIndex + 1]?.conversation_id ? (
                <ThreadTweetCard
                  tweetId={showTweets[currentIndex + 1]?.tweet_id || ""}
                  conversationId={
                    showTweets[currentIndex + 1]?.conversation_id || ""
                  }
                  fid={fid}
                  isRetweet={showTweets[currentIndex + 1]?.is_retweet || false}
                  retweetInfo={createRetweetInfo(showTweets[currentIndex + 1])}
                />
              ) : (
                <TweetCard
                  tweetId={showTweets[currentIndex + 1]?.tweet_id || ""}
                  isRetweet={showTweets[currentIndex + 1]?.is_retweet || false}
                  retweetInfo={createRetweetInfo(showTweets[currentIndex + 1])}
                />
              )}
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
            {currentTweet?.is_thread_tweet && currentTweet?.conversation_id ? (
              <ThreadTweetCard
                tweetId={currentTweet?.tweet_id || ""}
                conversationId={currentTweet?.conversation_id || ""}
                fid={fid}
                isRetweet={currentTweet?.is_retweet || false}
                retweetInfo={createRetweetInfo(currentTweet)}
              />
            ) : (
              <TweetCard
                tweetId={currentTweet?.tweet_id || ""}
                isRetweet={currentTweet?.is_retweet || false}
                retweetInfo={createRetweetInfo(currentTweet)}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-10 mt-6 w-full">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleReject}
            className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors"
          >
            <Cross />
          </button>
          <span className="text-sm font-medium text-[#B3B1B8]">Ignore</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleEdit}
            disabled={
              isEditLoading ||
              editTweetMutation.isPending ||
              hasVideoOrGif(currentTweet)
            }
            className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditLoading || editTweetMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Edit />
            )}
          </button>
          <span className="text-sm font-medium text-[#B3B1B8]">Edit</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleApprove}
            className="rounded-full bg-[#F8F8F8] p-4 flex items-center justify-center hover:bg-[#ECECED] transition-colors"
          >
            <ArrowRight />
          </button>
          <span className="text-sm font-medium text-[#B3B1B8]">Cast</span>
        </div>
      </div>

      <p className="text-center text-base font-medium text-[#B3B1B8] mt-3">
        <span className="text-[#8C8A94]">{currentIndex + 1}</span> of{" "}
        <span className="text-[#8C8A94]">{showTweets.length}</span>
      </p>

      <EditModal
        tweetId={currentTweet?.tweet_id || ""}
        conversationId={currentTweet?.conversation_id || undefined}
        onSave={handleEditSave}
        onClose={handleEditClose}
        isLoading={isEditLoading}
        isOpen={showEditModal}
        isRetweet={currentTweet?.is_retweet || false}
        databaseTweet={currentTweet}
      />

      <EditModal
        tweetId={currentTweet?.tweet_id || ""}
        conversationId={currentTweet?.conversation_id || undefined}
        onSave={handleConfirmSave}
        onClose={handleConfirmClose}
        isLoading={isCastLoading}
        isOpen={showConfirmModal}
        isRetweet={currentTweet?.is_retweet || false}
        databaseTweet={currentTweet}
        title="Confirm your cast"
        showConfirmation={true}
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
