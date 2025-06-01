interface TwitterNotVerifiedPageProps {
  onRetry: () => void;
  error: string;
}

export function TwitterNotVerifiedPage({
  onRetry,
  error,
}: TwitterNotVerifiedPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-light text-gray-900 mb-2">
            Twitter required
          </h1>
          <p className="text-gray-500 text-sm">
            Verify your Twitter account on Farcaster to enable cross-posting
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() =>
              window.open(
                "https://warpcast.com/~/settings/verified-addresses",
                "_blank",
              )
            }
            className="w-full bg-black text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Verify on Farcaster
          </button>

          <button
            onClick={onRetry}
            className="w-full text-gray-600 py-3 px-4 text-sm hover:bg-gray-50 rounded-lg transition-colors"
          >
            Check again
          </button>
        </div>
      </div>
    </div>
  );
}
