"use client";

import React from "react";
import { TweetNotFound, TweetSkeleton, useTweet } from "react-tweet";
import MyTweet from "./MyTweet";
import { useThreadTweets } from "@/hooks/useThreadTweets";
import Image from "next/image";
import BlueTick from "../icons/BlueTick";
import type { Tweet } from "react-tweet/api";

interface RetweetInfo {
  retweetedBy: {
    name: string;
    username: string;
    profileImageUrl: string;
    isVerified: boolean;
  };
  retweetedAt: string;
}

interface ThreadTweetCardProps {
  tweetId: string;
  conversationId: string;
  fid?: number;
  isRetweet?: boolean;
  retweetInfo?: RetweetInfo;
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else {
    // For tweets older than 30 days, show the date
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export default function ThreadTweetCard({
  tweetId,
  conversationId,
  fid,
  isRetweet,
  retweetInfo,
}: ThreadTweetCardProps) {
  const {
    data: firstTweet,
    error: firstTweetError,
    isLoading: firstTweetLoading,
  } = useTweet(tweetId);
  const {
    threadTweets,
    isLoading: threadLoading,
    error: threadError,
  } = useThreadTweets(conversationId);

  if (firstTweetLoading || threadLoading) {
    return (
      <div className="w-full h-full bg-white animate-pulse rounded-3xl border border-[#ECECED]" />
    );
  }

  if (firstTweetError || threadError || !firstTweet) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-[#ECECED] h-full relative z-10 overflow-y-auto">
      <div className="h-full overflow-y-auto p-3">
        {/* Retweet info if applicable */}
        {isRetweet && retweetInfo && (
          <div className="flex items-start gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <Image
              src={retweetInfo.retweetedBy.profileImageUrl}
              alt={retweetInfo.retweetedBy.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="text-[#100C20] text-base font-semibold flex items-center gap-1">
                {retweetInfo.retweetedBy.name}{" "}
                {retweetInfo.retweetedBy.isVerified ? <BlueTick /> : null}
              </p>
              <p className="text-[#8C8A94] text-sm flex items-center gap-1">
                @{retweetInfo.retweetedBy.username} ·{" "}
                <span className="text-[#8C8A94] text-sm">
                  {getRelativeTime(retweetInfo.retweetedAt)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* First tweet (main tweet) */}
        <div className="mb-4">
          <div className="flex items-start gap-2 mb-3">
            <Image
              src={firstTweet.user.profile_image_url_https}
              alt={firstTweet.user.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="text-[#100C20] text-base font-semibold flex items-center gap-1">
                {firstTweet.user.name}{" "}
                {firstTweet.user.is_blue_verified ? <BlueTick /> : null}
              </p>
              <p className="text-[#8C8A94] text-sm flex items-center gap-1">
                @{firstTweet.user.screen_name} ·{" "}
                <span className="text-[#8C8A94] text-sm">
                  {getRelativeTime(firstTweet.created_at)}
                </span>
              </p>
            </div>
          </div>

          {/* First tweet content */}
          <div className="ml-12">
            <div className="text-[#100C20] text-base mb-3 whitespace-pre-wrap break-words">
              {firstTweet.text.replace(/https:\/\/t\.co\/\w+/g, "")}
            </div>
            {firstTweet.mediaDetails?.length ? (
              <div className="mb-3">
                {firstTweet.mediaDetails.map((media: any, index: number) => (
                  <div key={index} className="mb-2">
                    {media.type === "photo" && (
                      <Image
                        src={media.media_url_https}
                        alt="Tweet media"
                        width={500}
                        height={300}
                        className="rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Thread replies */}
        {threadTweets && threadTweets.length > 1 && (
          <div className="border-l-2 border-[#ECECED] ml-5 pl-4">
            {threadTweets
              .filter(
                (tweet) => tweet.thread_position && tweet.thread_position > 1,
              )
              .sort(
                (a, b) => (a.thread_position || 0) - (b.thread_position || 0),
              )
              .map((threadTweet, index) => (
                <ThreadReplyTweet
                  key={threadTweet.tweet_id}
                  tweetId={threadTweet.tweet_id}
                  isLast={
                    index ===
                    threadTweets.filter(
                      (t) => t.thread_position && t.thread_position > 1,
                    ).length -
                      1
                  }
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for individual thread reply tweets
function ThreadReplyTweet({
  tweetId,
  isLast,
}: {
  tweetId: string;
  isLast: boolean;
}) {
  const { data: tweet, error, isLoading } = useTweet(tweetId);

  if (isLoading) {
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg animate-pulse h-20" />
    );
  }

  if (error || !tweet) {
    return null;
  }

  return (
    <div className={`relative ${!isLast ? "mb-4" : ""}`}>
      {/* Connection line */}
      <div className="absolute -left-4 top-0 w-2 h-6 border-b-2 border-[#ECECED]" />

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start gap-2 mb-2">
          <Image
            src={tweet.user.profile_image_url_https}
            alt={tweet.user.name}
            width={24}
            height={24}
            className="rounded-full"
          />
          <div className="text-xs text-[#8C8A94]">
            {tweet.user.name} · {getRelativeTime(tweet.created_at)}
          </div>
        </div>

        <div className="text-[#100C20] text-sm whitespace-pre-wrap break-words">
          {tweet.text.replace(/https:\/\/t\.co\/\w+/g, "")}
        </div>

        {tweet.mediaDetails?.length ? (
          <div className="mt-2">
            {tweet.mediaDetails.map((media: any, index: number) => (
              <div key={index} className="mb-1">
                {media.type === "photo" && (
                  <Image
                    src={media.media_url_https}
                    alt="Tweet media"
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
