interface SettingsPageProps {
  yoloMode: boolean;
  notifications: boolean;
  twitterUsername: string;
  signerUuid: string;
  onYoloToggle: () => void;
  onNotificationsToggle: (enabled: boolean) => void;
  onBack: () => void;
  spendingLimit?: number;
  spendingApproved?: boolean;
}

export function SettingsPage({
  yoloMode,
  notifications,
  twitterUsername,
  signerUuid,
  onYoloToggle,
  onNotificationsToggle,
  onBack,
  spendingLimit,
  spendingApproved,
}: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center p-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
          >
            ←
          </button>
          <h1 className="text-lg font-medium text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Automation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Automation
          </h3>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={yoloMode}
              onChange={onYoloToggle}
              className="w-4 h-4 text-black rounded mt-1"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1 text-sm">
                YOLO Mode
              </p>
              <p className="text-xs text-gray-600">
                Automatically cast all new tweets without approval. You'll be
                charged 0.1 USDC per tweet.
              </p>
            </div>
          </label>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => onNotificationsToggle(e.target.checked)}
                className="w-4 h-4 text-black rounded mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1 text-sm">
                  New tweet alerts
                </p>
                <p className="text-xs text-gray-600">
                  Get notified when new tweets are available to cast
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">Account</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Twitter connection
                </p>
                <p className="text-xs text-gray-600">@{twitterUsername}</p>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                ✓ Connected
              </span>
            </div>

            {signerUuid && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Neynar connection
                  </p>
                  <p className="text-xs text-gray-600">
                    Connected via OAuth for secure casting
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ Connected
                </span>
              </div>
            )}

            {spendingApproved && spendingLimit && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    USDC spending
                  </p>
                  <p className="text-xs text-gray-600">
                    Approved limit: ${spendingLimit}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ Approved
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
