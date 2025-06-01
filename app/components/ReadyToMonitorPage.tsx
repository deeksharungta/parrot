interface ReadyToMonitorPageProps {
  twitterUsername: string;
  onStart: () => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
  spendingLimit?: number;
}

export function ReadyToMonitorPage({
  twitterUsername,
  onStart,
  isLoading,
  error,
  setError,
  spendingLimit,
}: ReadyToMonitorPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-light text-gray-900 mb-4">Ready to go</h1>

          <div className="space-y-2 mb-6">
            <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-green-800">Farcaster connected</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-green-800">
                Twitter: @{twitterUsername}
              </span>
            </div>
            {spendingLimit && (
              <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <span className="text-green-600">✓</span>
                <span className="text-green-800">
                  USDC approved: ${spendingLimit}
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-6">
            Start monitoring your tweets to cross-post them to Farcaster
          </p>
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

        <button
          onClick={onStart}
          disabled={isLoading}
          className="w-full bg-black text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors mb-4"
        >
          {isLoading ? "Starting..." : "Start monitoring"}
        </button>

        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span>💰</span>
            <span>0.1 USDC per cast</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>✏️</span>
            <span>Edit before posting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
