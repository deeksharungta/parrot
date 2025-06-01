import { LoadingSpinner } from "./LoadingSpinner";

interface TwitterVerificationPageProps {
  onRetry: () => void;
  error: string;
}

export function TwitterVerificationPage({
  onRetry,
  error,
}: TwitterVerificationPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-xl font-light text-gray-900 mb-2">
            Verifying accounts
          </h1>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-600 text-sm">✓</span>
            <span className="text-sm text-green-800">Farcaster connected</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-800">Checking Twitter...</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={onRetry}
              className="text-red-500 text-xs mt-1 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
