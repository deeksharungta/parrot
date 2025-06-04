"use client";

import React from "react";
import { TweetNotFound, TweetSkeleton, useTweet } from "react-tweet";
import MyTweet from "./MyTweet";

export default function TweetCard({ tweetId }: { tweetId: string }) {
  const { data, error, isLoading } = useTweet(tweetId);
  if (isLoading)
    return (
      <div className="w-full h-full bg-white animate-pulse rounded-3xl border border-[#ECECED]" />
    );
  if (error)
    return (
      <div className="w-full h-full bg-white animate-pulse rounded-3xl border border-[#ECECED]">
        <p className="text-center text-base font-medium text-[#B3B1B8] mt-3">
          Not found
        </p>
      </div>
    );
  if (!data) return null;

  return <MyTweet tweet={data} />;
}
