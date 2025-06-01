import { useState } from "react";

interface SignerModalProps {
  pendingAction: "cast" | "yolo" | null;
  onSubmit: (signerUuid: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function SignerModal({
  pendingAction,
  onSubmit,
  onClose,
  isLoading,
}: SignerModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleNeynarConnect = async () => {
    setIsConnecting(true);

    try {
      // Generate a state parameter for security
      const state = Math.random().toString(36).substring(2, 15);

      // Store the state and pending action for when the user returns
      localStorage.setItem("neynar_auth_state", state);
      localStorage.setItem("pending_action", pendingAction || "");

      // Construct Neynar OAuth URL
      const neynarAuthUrl = new URL(
        "/api/auth/neynar/authorize",
        window.location.origin,
      );
      neynarAuthUrl.searchParams.set("state", state);
      neynarAuthUrl.searchParams.set(
        "redirect_uri",
        `${window.location.origin}/api/auth/neynar/callback`,
      );

      // Open Neynar auth in a new window
      const authWindow = window.open(
        neynarAuthUrl.toString(),
        "neynar-auth",
        "width=600,height=700,scrollbars=yes,resizable=yes",
      );

      // Listen for the auth completion
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "NEYNAR_AUTH_SUCCESS") {
          const { signerUuid } = event.data;
          window.removeEventListener("message", handleMessage);
          authWindow?.close();
          setIsConnecting(false);
          onSubmit(signerUuid);
        } else if (event.data.type === "NEYNAR_AUTH_ERROR") {
          window.removeEventListener("message", handleMessage);
          authWindow?.close();
          setIsConnecting(false);
          console.error("Neynar auth error:", event.data.error);
        }
      };

      window.addEventListener("message", handleMessage);

      // Handle if user closes the window manually
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error initiating Neynar auth:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Connect with Neynar
          </h3>
          <p className="text-gray-500 text-sm">
            {pendingAction === "cast"
              ? "To cast tweets, we need access to your Neynar signer"
              : "To enable YOLO mode, we need access to your Neynar signer"}
          </p>
        </div>

        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">🔐</span>
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">
                  Secure Authentication
                </h4>
                <p className="text-blue-700 text-xs leading-relaxed">
                  You'll be redirected to Neynar to securely authorize
                  TweetCaster. This allows us to cast on your behalf without
                  storing sensitive keys.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleNeynarConnect}
              disabled={isConnecting || isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Connect with Neynar</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isConnecting || isLoading}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              🔒 Your authorization is secure and can be revoked anytime from
              your Neynar dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
