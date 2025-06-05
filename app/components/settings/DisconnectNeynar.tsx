"use client";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { useNeynarContext } from "@neynar/react";

export default function DisconnectNeynar() {
  const { user, logoutUser } = useNeynarContext();

  return (
    <Container
      title={user ? "Disconnect Neynar" : "Connect Neynar"}
      description={
        user
          ? "If you disconnect, we won't be able to cast tweets on your behalf."
          : "to cast tweets, we need access to your Neynar signer"
      }
    >
      <Button
        variant={user ? "secondary" : "primary"}
        onClick={() => (user ? logoutUser() : window.open("/auth", "_blank"))}
      >
        {user ? "Disconnect Neynar" : "Connect Neynar"}
      </Button>
    </Container>
  );
}
