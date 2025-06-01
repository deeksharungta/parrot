import { useNeynarContext } from "@neynar/react";
import Image from "next/image";
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { TweetCasterExplainedModal } from "./TweetCasterExplainedModal";

interface WelcomePageProps {
  onReady: () => void;
  error: string;
  setError: (error: string) => void;
}

export function WelcomePage({ onReady, error, setError }: WelcomePageProps) {
  const { user } = useNeynarContext();
  const [showExplanation, setShowExplanation] = useState(false);

  if (user && !showExplanation) {
    onReady();
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-black rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-xl font-medium">TC</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">
            TweetCaster
          </h1>
          <p className="text-gray-500 text-sm">Cross-post to Farcaster</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 text-xs mt-1 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {!user ? (
          <div className="space-y-4">
            <LoadingSpinner text="Connecting..." />
            <button
              onClick={() => setShowExplanation(true)}
              className="text-gray-600 text-xs hover:underline"
            >
              Learn more about TweetCaster
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <Image
                src={user.pfp_url || ""}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">
                  {user.display_name}
                </p>
                <p className="text-gray-500 text-xs">@{user.username}</p>
              </div>
            </div>
            <LoadingSpinner text="Setting up..." />
          </div>
        )}

        {showExplanation && (
          <TweetCasterExplainedModal
            onClose={() => setShowExplanation(false)}
            onGetStarted={() => {
              setShowExplanation(false);
              if (user) {
                onReady();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
