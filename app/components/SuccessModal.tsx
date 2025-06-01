interface SuccessModalProps {
  castUrl: string;
  onClose: () => void;
}

export function SuccessModal({ castUrl, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md text-center p-6 border border-gray-200">
        <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
        <p className="text-gray-600 mb-2 text-sm">
          Your tweet has been posted to Farcaster
        </p>

        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-6">
          <span>💰</span>
          <span>Charged: 0.1 USDC</span>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.open(castUrl, "_blank")}
            className="w-full bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-900 transition-all text-sm"
          >
            View on Farcaster
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
          >
            Back to tweets
          </button>
        </div>
      </div>
    </div>
  );
}
