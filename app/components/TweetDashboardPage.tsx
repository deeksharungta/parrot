import { UsdcApprovalBanner } from "./UsdcApprovalBanner";
import { TweetCasterExplainedModal } from "./TweetCasterExplainedModal";
import { useState } from "react";

interface Tweet {
  id: string;
  content: string;
  twitter_created_at: string | null;
  twitter_url: string | null;
  cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
  is_edited: boolean;
}

interface TweetDashboardPageProps {
  tweets: Tweet[];
  twitterUsername: string;
  yoloMode: boolean;
  onYoloToggle: () => void;
  onCastRequest: (tweetId: string) => void;
  onEditTweet: (tweet: Tweet) => void;
  onSettingsClick: () => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
  spendingApproved?: boolean;
  onUsdcApprove?: (spendingLimit: number) => void;
}

export function TweetDashboardPage({
  tweets,
  twitterUsername,
  yoloMode,
  onYoloToggle,
  onCastRequest,
  onEditTweet,
  onSettingsClick,
  isLoading,
  error,
  setError,
  spendingApproved,
  onUsdcApprove,
}: TweetDashboardPageProps) {
  const [showExplanation, setShowExplanation] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">TC</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">TweetCaster</h1>
              <p className="text-xs text-gray-500">@{twitterUsername}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExplanation(true)}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              title="How TweetCaster works"
            >
              <span className="text-lg">❓</span>
            </button>
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between text-center">
          <div>
            <p className="text-xl font-light text-gray-900">{tweets.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-xl font-light text-green-600">
              {tweets.filter((t) => t.cast_status === "cast").length}
            </p>
            <p className="text-xs text-gray-500">Casted</p>
          </div>
          <div>
            <p className="text-xl font-light text-orange-600">
              {tweets.filter((t) => t.cast_status === "pending").length}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* USDC Approval Banner */}
        {!spendingApproved && onUsdcApprove && (
          <UsdcApprovalBanner
            onApprove={onUsdcApprove}
            isLoading={isLoading}
            error={error}
            setError={setError}
          />
        )}

        {/* YOLO Mode Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">YOLO Mode</h3>
              <p className="text-xs text-gray-500">Auto-cast all new tweets</p>
            </div>
            <button
              onClick={onYoloToggle}
              disabled={!spendingApproved}
              className={`relative w-10 h-6 rounded-full transition-all ${
                yoloMode ? "bg-black" : "bg-gray-300"
              } ${!spendingApproved ? "opacity-50" : ""}`}
            >
              <div
                className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                  yoloMode ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>
          {!spendingApproved && (
            <p className="text-xs text-gray-400 mt-2">
              Approve USDC spending to enable YOLO mode
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 text-xs mt-1 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tweets */}
        <div className="space-y-3">
          {tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🐦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm leading-relaxed mb-2">
                    {tweet.content}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatDate(tweet.twitter_created_at)}</span>
                    {tweet.is_edited && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        Edited
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full ${
                        tweet.cast_status === "cast"
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {tweet.cast_status === "cast" ? "Casted" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onCastRequest(tweet.id)}
                  disabled={
                    isLoading ||
                    tweet.cast_status === "cast" ||
                    !spendingApproved
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    tweet.cast_status === "cast"
                      ? "bg-green-100 text-green-700 cursor-default"
                      : !spendingApproved
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
                  }`}
                >
                  {tweet.cast_status === "cast"
                    ? "✅ Casted"
                    : !spendingApproved
                      ? "💰 Approve USDC first"
                      : "Cast - 0.1 USDC"}
                </button>
                <button
                  onClick={() => onEditTweet(tweet)}
                  disabled={isLoading || tweet.cast_status === "cast"}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanation && (
        <TweetCasterExplainedModal
          onClose={() => setShowExplanation(false)}
          onGetStarted={() => setShowExplanation(false)}
        />
      )}
    </div>
  );
}
