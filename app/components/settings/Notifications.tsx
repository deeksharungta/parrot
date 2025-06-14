import React from "react";
import Button from "../ui/Button";
import Container from "../ui/Container";

export default function Notifications() {
  return (
    <Container
      title="Notifications"
      description="We fetch new tweets every 10 minutes. You'll get a notification when they're ready to cast."
    >
      <Button variant="secondary">Disable Notifications</Button>
    </Container>
  );
}
