"use client";

import React from "react";
import { TweetNotFound, TweetSkeleton, useTweet } from "react-tweet";
import MyTweet from "./MyTweet";

interface RetweetInfo {
  retweetedBy: {
    name: string;
    username: string;
    profileImageUrl: string;
    isVerified: boolean;
  };
  retweetedAt: string;
}

interface TweetCardProps {
  tweetId: string;
  isRetweet?: boolean;
  retweetInfo?: RetweetInfo;
}

export default function TweetCard({
  tweetId,
  isRetweet,
  retweetInfo,
}: TweetCardProps) {
  const { data, error, isLoading } = useTweet(tweetId);
  if (isLoading)
    return (
      <div className="w-full h-full bg-white animate-pulse rounded-3xl border border-[#ECECED]" />
    );
  if (error) return null;
  if (!data) return null;

  return (
    <MyTweet tweet={data} isRetweet={isRetweet} retweetInfo={retweetInfo} />
  );
}
