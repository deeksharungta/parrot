"use client";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { useGetUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";

export default function DisconnectNeynar() {
  const { context } = useMiniKit();
  const { data: userData } = useGetUser(context?.user?.fid);

  const handleOpenAuth = async () => {
    await sdk.actions.openUrl(`https://xcast-miniapp.vercel.app/auth`);
  };

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
