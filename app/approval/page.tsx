"use client";

import React, { useEffect } from "react";
import Header from "../components/ui/Header";
import Navbar from "../components/ui/Navbar";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import Approve from "../components/approval/Approve";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useUSDCApproval } from "@/hooks/useUSDCApproval";

export default function ApprovalPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected } = useAccount();
  const { hasAllowance, handleRevoke, isRevoking } = useUSDCApproval();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <div>
      <Header title="Configure spending" />
      <motion.div
        className="flex flex-col gap-5 mt-4 h-[calc(100dvh-170px)] px-5 pb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Approve />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Container
            title="Revoke USDC"
            description="when you revoke, we stop all charges immediately."
          >
            <Button
              variant="red"
              onClick={handleRevoke}
              disabled={isRevoking || !isConnected || !hasAllowance}
            >
              {isRevoking ? "Revoking..." : "Revoke Allowance"}
            </Button>
          </Container>
        </motion.div>
      </motion.div>
      <Navbar />
    </div>
  );
}
