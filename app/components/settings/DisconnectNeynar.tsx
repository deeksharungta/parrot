"use client";

import { useState, useEffect } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useCurrentUser } from "@/hooks/useUsers";
import {
  useCreateSigner,
  useStoredSigner,
  useDisconnectSigner,
  useApproveSigner,
} from "@/hooks/useSigner";

export default function DisconnectNeynar() {
  const { data: userData, refetch } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  // Get stored signer from cookies
  const { data: storedSigner } = useStoredSigner();

  // Create signer mutation
  const createSignerMutation = useCreateSigner();

  // Disconnect signer mutation
  const disconnectSignerMutation = useDisconnectSigner();

  // Approve signer mutation
  const approveSignerMutation = useApproveSigner();

  // Check for approval when component mounts or user returns
  useEffect(() => {
    const checkApproval = async () => {
      if (
        storedSigner?.signer_uuid &&
        storedSigner.status === "pending_approval"
      ) {
        try {
          await approveSignerMutation.mutateAsync(storedSigner.signer_uuid);
          refetch(); // Refresh user data
        } catch (error) {
          // Silent fail - user hasn't approved yet
        }
      }
    };

    checkApproval();

    // Also check when window regains focus (user returns from approval)
    const handleFocus = () => {
      setTimeout(checkApproval, 1000); // Small delay to ensure approval is processed
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [storedSigner, approveSignerMutation, refetch]);

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
            ? "Creating..."
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
