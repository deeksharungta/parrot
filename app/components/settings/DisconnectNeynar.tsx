"use client";

import { useEffect } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import { useGetUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
import { useQueryClient } from "@tanstack/react-query";

export default function DisconnectNeynar() {
  const { context } = useMiniKit();
  const { data: userData, refetch } = useGetUser(context?.user?.fid);
  const queryClient = useQueryClient();

  const handleOpenAuth = async () => {
    await sdk.actions.openUrl(`https://xcast-miniapp.vercel.app/auth`);
  };

  // Auto-refresh data when user returns from auth
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to ensure auth completion
      setTimeout(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }, 1000);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, queryClient]);

  return (
    <Container
      title={
        userData?.user?.neynar_signer_uuid
          ? "Disconnect Neynar"
          : "Connect Neynar"
      }
      description={
        userData?.user?.neynar_signer_uuid
          ? "If you disconnect, we won't be able to cast tweets on your behalf."
          : "to cast tweets, we need access to your Neynar signer"
      }
    >
      <Button
        variant={userData?.user?.neynar_signer_uuid ? "secondary" : "primary"}
        onClick={handleOpenAuth}
      >
        {userData?.user?.neynar_signer_uuid
          ? "Disconnect Neynar"
          : "Connect Neynar"}
      </Button>
    </Container>
  );
}
