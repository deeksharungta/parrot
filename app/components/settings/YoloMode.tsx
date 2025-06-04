import React from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";

export default function YoloMode() {
  return (
    <Container
      title="Yolo Mode"
      description="Automatically cast all new tweets without approval. You'll be charged 0.1 USDC per cast."
    >
      <Button>Enable YOLO Mode</Button>
      <p className="text-[#8C8A94] text-xs font-normal text-center px-5">
        YOLO mode stops automatically when your allowance runs out. We&apos;ll
        notify you.
      </p>
    </Container>
  );
}
