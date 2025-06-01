import React from "react";
import Image from "next/image";

interface Tweet {
  id: string;
  content: string;
  twitter_created_at: string | null;
  twitter_url: string | null;
  cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
  is_edited: boolean;
}

interface TweetCardProps {
  tweet: Tweet;
  userProfileImage?: string;
  userName?: string;
  onCastApprove?: (tweetId: string) => void;
  onCastReject?: (tweetId: string) => void;
}

export const TweetCard: React.FC<TweetCardProps> = ({
  tweet,
  userProfileImage,
  userName,
  onCastApprove,
  onCastReject,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "cast":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {userProfileImage && (
          <Image
            src={userProfileImage}
            width={32}
            height={32}
            alt="Profile"
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{userName}</p>
          {tweet.twitter_created_at && (
            <p className="text-xs text-gray-500">
              {formatDate(tweet.twitter_created_at)}
            </p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tweet.cast_status)}`}
        >
          {tweet.cast_status}
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 text-sm leading-relaxed">{tweet.content}</p>
        {tweet.is_edited && (
          <span className="text-xs text-gray-500 italic mt-1 block">
            Edited
          </span>
        )}
      </div>

      {/* Actions */}
      {tweet.cast_status === "pending" && onCastApprove && onCastReject && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onCastApprove(tweet.id)}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Cast to Farcaster
          </button>
          <button
            onClick={() => onCastReject(tweet.id)}
            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {/* External Link */}
      {tweet.twitter_url && (
        <div className="pt-2 border-t border-gray-100 mt-2">
          <a
            href={tweet.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-xs hover:underline"
          >
            View on Twitter ↗
          </a>
        </div>
      )}
    </div>
  );
};
