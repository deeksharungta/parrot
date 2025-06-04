import React from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";

export default function DisconnectNeynar() {
  return (
    <Container
      title="Disconnect Neynar"
      description="If you disconnect, we won't be able to cast tweets on your behalf."
    >
      <Button variant="secondary">Disconnect Neynar</Button>
    </Container>
  );
}
