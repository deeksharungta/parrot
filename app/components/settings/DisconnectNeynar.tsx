"use client";

import { useState, useEffect } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useCurrentUser } from "@/hooks/useUsers";
import {
  useCreateSigner,
  useSignerApprovalStatus,
  useDisconnectSigner,
  usePollingSignerApproval,
} from "@/hooks/useSigner";

export default function DisconnectNeynar() {
  const { data: userData, refetch } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  // Get signer approval status from database
  const { data: signerStatus } = useSignerApprovalStatus();

  // Create signer mutation
  const createSignerMutation = useCreateSigner();

  // Disconnect signer mutation
  const disconnectSignerMutation = useDisconnectSigner();

  // Poll for signer approval when status is pending
  usePollingSignerApproval(
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

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await createSignerMutation.mutateAsync();
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

  const isConnected = userData?.user?.neynar_signer_uuid;

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
