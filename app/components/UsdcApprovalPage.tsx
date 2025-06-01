import { useState } from "react";

interface UsdcApprovalPageProps {
  onApprove: (spendingLimit: number) => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export function UsdcApprovalPage({
  onApprove,
  isLoading,
  error,
  setError,
}: UsdcApprovalPageProps) {
  const [spendingLimit, setSpendingLimit] = useState(10); // Default to $10 USDC
  const [customLimit, setCustomLimit] = useState(false);

  const presetLimits = [5, 10, 25, 50];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-xl font-light text-gray-900 mb-2">
            Approve USDC spending
          </h1>
          <p className="text-gray-500 text-sm">
            Set a spending limit for casting tweets to Farcaster
          </p>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
              <span>💳</span>
              <span>Each cast costs 0.1 USDC</span>
            </div>
            <div className="text-xs text-gray-500">
              You'll only be charged when you approve a cast
            </div>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Spending limit
            </label>

            {!customLimit ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {presetLimits.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setSpendingLimit(limit)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      spendingLimit === limit
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ${limit} USDC
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={spendingLimit}
                    onChange={(e) => setSpendingLimit(Number(e.target.value))}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                  <span className="text-gray-500 text-sm">USDC</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setCustomLimit(!customLimit)}
              className="text-gray-600 text-xs hover:underline mb-4"
            >
              {customLimit ? "Use preset amounts" : "Enter custom amount"}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-xs">
                You can change this limit anytime in Settings
              </p>
            </div>
          </div>
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

        <div className="space-y-3">
          <button
            onClick={() => onApprove(spendingLimit)}
            disabled={isLoading || spendingLimit < 1}
            className="w-full bg-black text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Approving..." : `Approve $${spendingLimit} USDC`}
          </button>

          <div className="text-xs text-gray-500 text-center">
            This allows TweetCaster to spend up to ${spendingLimit} USDC from
            your wallet for casting tweets
          </div>
        </div>
      </div>
    </div>
  );
}
