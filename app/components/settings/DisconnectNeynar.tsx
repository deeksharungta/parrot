"use client";

import { useState, useEffect } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useCurrentUser } from "@/hooks/useUsers";
import QRCode from "react-qr-code";
import {
  useCreateSigner,
  useSignerApprovalStatus,
  useDisconnectSigner,
  usePollingSignerApproval,
} from "@/hooks/useSigner";

export default function DisconnectNeynar() {
  const { data: userData } = useCurrentUser();
  const [loading, setLoading] = useState(false);

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

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const approvalUrl = await createSignerMutation.mutateAsync();
      // If an approval URL is returned, open it in a new window
      if (approvalUrl && typeof approvalUrl === "string") {
        window.open(approvalUrl, "_blank", "noopener,noreferrer");
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
  const shouldShowQRCode =
    !isConnected &&
    signerData?.signer_approval_url &&
    signerStatus?.signer_approval_status === "pending";

  return (
    <Container
      title={isConnected ? "Disconnect Neynar" : "Connect Neynar"}
      description={
        isConnected
          ? "If you disconnect, we won't be able to cast tweets on your behalf."
          : "to cast tweets, we need access to your Neynar signer"
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
            : "Connect Neynar"}
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
            : "Disconnect Neynar"}
        </Button>
      )}
    </Container>
  );
}
