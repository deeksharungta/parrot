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
import { Loader2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import FreeCastBanner from "../components/promotional/FreeCastBanner";

export default function ApprovalPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected } = useAccount();
  const { hasAllowance, handleRevoke, isRevoking } = useUSDCApproval();

  // Track page view
  useEffect(() => {
    analytics.trackPageView("approval", {
      is_connected: isConnected,
      has_allowance: hasAllowance,
    });
  }, [isConnected, hasAllowance]);

  const handleRevokeWithTracking = async () => {
    analytics.trackUSDCApproval(0, "requested");
    await handleRevoke();
  };

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <div>
      <Header title="Configure spending" />
      <motion.div
        className="flex flex-col gap-5 mt-4 h-[calc(100dvh-200px)] px-5 pb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <FreeCastBanner />
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
              onClick={handleRevokeWithTracking}
              disabled={isRevoking || !isConnected || !hasAllowance}
              trackingName="revoke_allowance"
              trackingLocation="approval_page"
            >
              {isRevoking ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Revoke Allowance"
              )}
            </Button>
          </Container>
        </motion.div>
      </motion.div>
      <Navbar />
    </div>
  );
}
