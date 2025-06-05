"use client";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { useGetUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function DisconnectNeynar() {
  const { context } = useMiniKit();
  const { data: userData } = useGetUser(context?.user?.fid);

  const handleOpenAuth = () => {
    const authUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth`;

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // For iOS, try creating a temporary anchor element and clicking it
      const tempLink = document.createElement("a");
      tempLink.href = authUrl;
      tempLink.target = "_blank";
      tempLink.rel = "noopener noreferrer";
      tempLink.style.display = "none";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    } else {
      // For other platforms, use window.open
      window.open(authUrl, "_blank");
    }
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
