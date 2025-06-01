interface TweetCasterExplainedModalProps {
  onClose: () => void;
  onGetStarted: () => void;
}

export function TweetCasterExplainedModal({
  onClose,
  onGetStarted,
}: TweetCasterExplainedModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            TweetCaster, explained
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Cross-posting */}
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">
                cross-post
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                automatically monitor your Twitter timeline and cross-post
                tweets to Farcaster with approval
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-1">
                edit tweets before posting or enable YOLO mode for automatic
                casting (coming soon)
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💰</span>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">
                simple pricing
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                pay 0.1 USDC each time you cast a tweet to Farcaster
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-1">
                set your own spending limit and top up anytime. you're always in
                control.
              </p>
            </div>
          </div>

          {/* Privacy & Control */}
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">
                privacy & control
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                we only read your public tweets. you approve each cast
                individually or use YOLO mode
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-1">
                pause, resume, or stop monitoring anytime from settings
              </p>
            </div>
          </div>

          {/* Farcaster Integration */}
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">
                seamless integration
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                connects to your verified Twitter account on Farcaster
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-1">
                uses your Neynar signer for secure, gasless casting to Farcaster
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onGetStarted}
            className="w-full bg-black text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
