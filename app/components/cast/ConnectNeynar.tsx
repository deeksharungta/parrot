import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import Cross from "../icons/Cross";
import Button from "../ui/Button";
import { useCurrentUser } from "@/hooks/useUsers";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import {
  useCreateSigner,
  useSignerApprovalStatus,
  usePollingSignerApproval,
} from "@/hooks/useSigner";
import sdk from "@farcaster/frame-sdk";
import QRCodeModal from "../settings/QRModal";

interface ConnectNeynarProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ConnectNeynar({ onClose, isOpen }: ConnectNeynarProps) {
  const { data: userData, refetch } = useCurrentUser();
  const { isMobile } = useDeviceDetection();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentApprovalUrl, setCurrentApprovalUrl] = useState<string | null>(
    null,
  );

  // Create signer mutation
  const createSignerMutation = useCreateSigner();

  // Get signer approval status from database
  const { data: signerStatus } = useSignerApprovalStatus();

  // Poll for signer approval when status is pending
  const { isApproved } = usePollingSignerApproval(
    signerStatus?.signer_uuid || null,
    signerStatus?.signer_approval_status === "pending",
  );

  // Check for approval when window regains focus (user returns from approval)
  useEffect(() => {
    const handleFocus = () => {
      if (
        signerStatus?.signer_uuid &&
        signerStatus.signer_approval_status === "pending"
      ) {
        // The polling hook will handle the approval check automatically
        refetch(); // Just refresh user data
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [signerStatus, refetch]);

  // Close modal when approved
  useEffect(() => {
    if (isApproved) {
      setShowQRModal(false);
      setCurrentApprovalUrl(null);
    }
  }, [isApproved]);

  const handleConnectNeynar = async () => {
    setLoading(true);
    try {
      const approvalUrl = await createSignerMutation.mutateAsync();

      // If an approval URL is returned, handle based on device type
      if (approvalUrl && typeof approvalUrl === "string") {
        setCurrentApprovalUrl(approvalUrl);
        if (isMobile) {
          // On mobile, redirect directly to the approval URL
          sdk.actions.openUrl(approvalUrl);
          sdk.actions.close();
        } else {
          // On desktop, show the QR code modal
          setShowQRModal(true);
        }
      }
    } catch (error) {
      console.error("Failed to create signer:", error);
    } finally {
      setLoading(false);
    }
  };

  const isConnected =
    userData?.user?.neynar_signer_uuid &&
    userData?.user?.signer_approval_status === "approved";

  const showSuccessState = isApproved || isConnected;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-white/20 z-40 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
              className="fixed bottom-2 left-2 right-2 bg-white rounded-[32px] border border-[#ECECED] z-50 max-h-[80vh] overflow-hidden p-6"
            >
              <div className="flex items-center justify-between">
                {!showSuccessState && (
                  <h3 className="text-base font-semibold text-[#100c20]">
                    Authorize Signer
                  </h3>
                )}
                <button
                  onClick={onClose}
                  className={showSuccessState ? "ml-auto" : ""}
                >
                  <Cross />
                </button>
              </div>

              {showSuccessState ? (
                <div className="flex flex-col items-center text-center">
                  {/* Success Icon */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-100">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="text-green-600"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-[#100c20] mb-2">
                    You're Connected!
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#8C8A94] mb-6">
                    Your signer has been successfully authorized. You can now
                    cast tweets.
                  </p>

                  {/* Continue Button */}
                  <Button
                    className="w-full"
                    onClick={onClose}
                    variant="primary"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#8C8A94]">
                    to cast tweets, we need to authorize your signer
                  </p>
                  <div className="my-6 overflow-hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="339"
                      height="9"
                      viewBox="0 0 339 9"
                      fill="none"
                    >
                      <path
                        d="M0.542969 8L6.83464 4.5C10.7468 2.3237 15.5058 2.3237 19.418 4.5V4.5C23.3301 6.6763 28.0891 6.6763 32.0013 4.5V4.5C35.9134 2.3237 40.6725 2.3237 44.5846 4.5V4.5C48.4968 6.6763 53.2558 6.6763 57.168 4.5V4.5C61.0801 2.3237 65.8391 2.32371 69.7513 4.5V4.5C73.6634 6.6763 78.4225 6.6763 82.3346 4.5V4.5C86.2468 2.3237 91.0058 2.32371 94.918 4.5V4.5C98.8301 6.6763 103.589 6.6763 107.501 4.5V4.5C111.413 2.3237 116.172 2.32371 120.085 4.5V4.5C123.997 6.67629 128.756 6.6763 132.668 4.5V4.5C136.58 2.3237 141.339 2.32371 145.251 4.5V4.5C149.163 6.67629 153.922 6.6763 157.835 4.5V4.5C161.747 2.3237 166.506 2.32371 170.418 4.5V4.5C174.33 6.67629 179.089 6.6763 183.001 4.5V4.5C186.913 2.3237 191.672 2.32371 195.585 4.5V4.5C199.497 6.67629 204.256 6.67629 208.168 4.5V4.5C212.08 2.3237 216.839 2.3237 220.751 4.5V4.5C224.663 6.6763 229.422 6.67629 233.335 4.5V4.5C237.247 2.32371 242.006 2.32371 245.918 4.5V4.5C249.83 6.67629 254.589 6.6763 258.501 4.5V4.5C262.413 2.3237 267.202 2.34012 271.114 4.51641V4.51641C274.99 6.67239 279.734 6.68865 283.609 4.53267L283.899 4.37148C287.659 2.2801 292.268 2.33272 295.994 4.48375V4.48375C299.745 6.64955 304.395 6.66581 308.146 4.5V4.5C311.897 2.33419 316.519 2.33419 320.271 4.5V4.5C324.022 6.66581 328.644 6.66581 332.395 4.5L338.457 1"
                        stroke="#E2E2E4"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 bg-[#E4FCFF] rounded-xl p-3">
                    <p className="text-sm font-medium text-[#0B92F9]">
                      Secure Authentication
                    </p>
                    <p className="text-sm font-light text-[#0BABFB]">
                      You'll be redirected to securely authorize parrot. This
                      allows us to cast on your behalf without storing sensitive
                      keys.
                    </p>
                  </div>
                  <Button
                    className="mt-6"
                    onClick={handleConnectNeynar}
                    disabled={
                      loading || createSignerMutation.isPending || !!isConnected
                    }
                  >
                    {loading || createSignerMutation.isPending
                      ? "Connecting..."
                      : isConnected
                        ? "Already Connected"
                        : "Authorize Signer"}
                  </Button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {currentApprovalUrl && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setCurrentApprovalUrl(null);
          }}
          approvalUrl={currentApprovalUrl}
        />
      )}
    </>
  );
}
