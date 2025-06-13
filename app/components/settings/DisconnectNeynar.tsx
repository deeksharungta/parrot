"use client";

import { useState, useEffect } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useCurrentUser } from "@/hooks/useUsers";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import {
  useCreateSigner,
  useSignerApprovalStatus,
  useDisconnectSigner,
  usePollingSignerApproval,
} from "@/hooks/useSigner";
import sdk from "@farcaster/frame-sdk";
import QRCodeModal from "./QRModal";

export default function DisconnectNeynar() {
  const { data: userData } = useCurrentUser();
  const { isMobile } = useDeviceDetection();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentApprovalUrl, setCurrentApprovalUrl] = useState<string | null>(
    null,
  );

  // Get signer approval status from database
  const { data: signerStatus } = useSignerApprovalStatus();

  // Create signer mutation
  const createSignerMutation = useCreateSigner();

  // Disconnect signer mutation
  const disconnectSignerMutation = useDisconnectSigner();

  // Poll for signer approval when status is pending - this contains the approval URL
  const {
    data: signerData,
    isApproved,
    refetch,
  } = usePollingSignerApproval(
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
        refetch();
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

  const handleSignIn = async () => {
    console.log(
      "🚀 Sign-in initiated - Current device type:",
      isMobile ? "📱 MOBILE" : "💻 DESKTOP",
    );
    setLoading(true);
    try {
      const approvalUrl = await createSignerMutation.mutateAsync();

      // If an approval URL is returned, handle based on device type
      if (approvalUrl && typeof approvalUrl === "string") {
        setCurrentApprovalUrl(approvalUrl);
        if (isMobile) {
          console.log("📱 Mobile detected: Redirecting to approval URL");
          // On mobile, redirect directly to the approval URL
          sdk.actions.openUrl(approvalUrl);
        } else {
          console.log("💻 Desktop detected: Opening QR code modal");
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

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectSignerMutation.mutateAsync();
      refetch(); // Refresh user data
    } catch (error) {
      console.error("Failed to disconnect signer:", error);
    } finally {
      setLoading(false);
    }
  };

  const isConnected =
    userData?.user?.neynar_signer_uuid &&
    userData?.user?.signer_approval_status === "approved";

  return (
    <>
      <Container
        title={isConnected ? "Disconnect Signer" : "Authorize Signer"}
        description={
          isConnected
            ? "If you disconnect, we won't be able to cast tweets on your behalf."
            : "to cast tweets, we need to authorize your signer"
        }
      >
        {!isConnected && (
          <Button
            variant="primary"
            onClick={handleSignIn}
            disabled={loading || createSignerMutation.isPending}
          >
            {loading || createSignerMutation.isPending
              ? "Connecting..."
              : "Authorize Signer"}
          </Button>
        )}

        {isConnected && (
          <Button
            variant="secondary"
            onClick={handleDisconnect}
            disabled={loading || disconnectSignerMutation.isPending}
          >
            {loading || disconnectSignerMutation.isPending
              ? "Disconnecting..."
              : "Disconnect Signer"}
          </Button>
        )}
      </Container>
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
