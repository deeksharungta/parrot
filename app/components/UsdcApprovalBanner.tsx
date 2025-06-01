import { useState } from "react";

interface UsdcApprovalBannerProps {
  onApprove: (spendingLimit: number) => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export function UsdcApprovalBanner({
  onApprove,
  isLoading,
  error,
  setError,
}: UsdcApprovalBannerProps) {
  const [spendingLimit, setSpendingLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const presetLimits = [
    { amount: 5, label: "$5" },
    { amount: 10, label: "$10" },
    { amount: 25, label: "$25" },
    { amount: 50, label: "$50" },
    { amount: 100, label: "$100" },
    { amount: 500, label: "$500" },
  ];

  if (!showForm) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-medium text-blue-900 text-sm">
                Approve 💲 USDC spending to start casting
              </h3>
              <p className="text-blue-700 text-xs">
                Set a spending limit - 0.1 USDC per cast
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Configure
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 text-base">
          Configure Spending
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Approve USDC Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 text-sm flex items-center space-x-2">
            <span>Approve</span>
            <span className="text-blue-600">💲</span>
            <span>USDC</span>
          </h4>
          <button className="text-gray-400 hover:text-gray-600">
            <span>⌄</span>
          </button>
        </div>

        <p className="text-gray-600 text-xs mb-4 leading-relaxed">
          approve a spending limit for TweetCaster. when it runs out, top it up
          or revoke it anytime
        </p>

        {/* Wallet Address Mock */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <span className="text-gray-500">connected wallet</span>
          <span className="text-gray-700 font-mono">0x742d...5b2</span>
        </div>

        {/* Current Spending Limit */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 text-sm">spending limit</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-light">{spendingLimit}</span>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">💲</span>
              </div>
            </div>
          </div>

          {/* Preset Amounts Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {presetLimits.map((preset) => (
              <button
                key={preset.amount}
                onClick={() => setSpendingLimit(preset.amount)}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                  spendingLimit === preset.amount
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{preset.amount}</span>
                <span className="text-blue-600">💲</span>
                <span className="text-xs text-gray-500">
                  (${preset.amount})
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 text-xs mt-1 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onApprove(spendingLimit)}
            disabled={isLoading || spendingLimit < 1}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Approve {spendingLimit}</span>
            <span className="text-blue-200">💲</span>
            <span>USDC</span>
          </button>

          <div className="text-xs text-gray-500 text-center">
            <p>Each cast costs 0.1 USDC • Revoke allowance anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
