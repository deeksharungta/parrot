"use client";

import React, { useEffect } from "react";
import Header from "../components/ui/Header";
import Navbar from "../components/ui/Navbar";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import Approve from "../components/approval/Approve";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function ApprovalPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);
  return (
    <div className="p-5">
      <Header title="Configure spending" />
      <div className="flex flex-col gap-5 mt-9">
        <Approve />
        <Container
          title="Revoke USDC"
          description="when you revoke, we stop all charges immediately."
        >
          <Button variant="red">Revoke Allowance</Button>
        </Container>
      </div>
      <Navbar />
    </div>
  );
}
