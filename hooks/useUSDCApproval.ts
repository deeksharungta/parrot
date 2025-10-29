import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, parseUnits, formatUnits } from "viem";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constants";
import { useUpdateUser } from "./useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import React from "react";

export interface UseUSDCApprovalReturn {
  // State
  isApproving: boolean;
  isRevoking: boolean;
  error: string;
  isConnected: boolean;
  address: string | undefined;

  // Allowance data
  currentAllowance: bigint | undefined;
  currentAllowanceFormatted: string;
  hasAllowance: boolean;
  isAllowanceLoading: boolean;
  isAllowanceUpdating: boolean;

  // Functions
  handleApprove: (amount: number) => Promise<void>;
  handleRevoke: () => Promise<void>;
  refetchAllowance: () => void;
  clearError: () => void;
}

export function useUSDCApproval(): UseUSDCApprovalReturn {
  const [isApproving, setIsApproving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string>("");
  const [pendingTxHash, setPendingTxHash] = useState<string | undefined>();
  const [isAllowanceUpdating, setIsAllowanceUpdating] = useState(false);
  const [pendingTxType, setPendingTxType] = useState<
    "approve" | "revoke" | null
  >(null);

  const { writeContractAsync } = useWriteContract();
  const updateUser = useUpdateUser();
  const { context } = useMiniKit();
  const queryClient = useQueryClient();

  const { address, isConnected } = useAccount();

  // Check current allowance
  const {
    data: currentAllowance,
    refetch: refetchAllowance,
    isLoading: isAllowanceLoading,
    isPending: isAllowancePending,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && SPENDER_ADDRESS ? [address, SPENDER_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Wait for transaction confirmation
  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}`,
    query: {
      enabled: !!pendingTxHash,
    },
  });

  // Refetch allowance when transaction is confirmed
  React.useEffect(() => {
    if (txReceipt && txReceipt.status === "success") {
      refetchAllowance();
      setPendingTxHash(undefined);
      setIsAllowanceUpdating(false);

      // Show success toast after confirmation based on transaction type
      if (pendingTxType === "revoke") {
        toast(`USDC Revoked!`, {
          description: `Spending allowance removed successfully`,
        });
      } else if (pendingTxType === "approve") {
        toast(`USDC Approved!`, {
          description: `Spending limit updated successfully`,
        });
      }

      setPendingTxType(null);
    }
  }, [txReceipt, refetchAllowance, pendingTxType]);

  const handleApprove = async (amount: number) => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!context?.user?.fid) {
      setError("User not found");
      return;
    }

    setError("");
    setIsApproving(true);
    setIsAllowanceUpdating(true);

    try {
      // Convert spending limit to USDC amount (6 decimals)
      const amountBigInt = parseUnits(amount.toString(), 6);

      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SPENDER_ADDRESS, amountBigInt],
      });

      // Set pending transaction hash and type to wait for confirmation
      setPendingTxHash(hash);
      setPendingTxType("approve");

      // Save approval to Supabase users table
      try {
        await updateUser.mutateAsync({
          farcaster_fid: context.user.fid,
          wallet_address: address,
          spending_approved: true,
          spending_limit: amount,
          usdc_balance: amount, // Set initial balance to spending limit
        });
      } catch (dbError) {
        console.error("Failed to save approval to database:", dbError);
        // Don't fail the entire operation if database save fails
      }

      // Only invalidate the specific user query instead of all users
      if (context.user.fid) {
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", context.user.fid],
        });
      }

      setIsApproving(false);
    } catch (err: any) {
      setIsApproving(false);
      setIsAllowanceUpdating(false);
      setError(err.message || "Failed to approve USDC spending");
      console.error("Approval error:", err);
    }
  };

  const handleRevoke = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!context?.user?.fid) {
      setError("User not found");
      return;
    }

    setError("");
    setIsRevoking(true);
    setIsAllowanceUpdating(true);

    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SPENDER_ADDRESS, BigInt(0)], // Set allowance to 0 to revoke
      });

      // Set pending transaction hash and type to wait for confirmation
      setPendingTxHash(hash);
      setPendingTxType("revoke");

      // Save revocation to Supabase users table
      try {
        await updateUser.mutateAsync({
          farcaster_fid: context.user.fid,
          wallet_address: address,
          spending_approved: false,
          spending_limit: 0,
          usdc_balance: 0, // Reset balance when revoking
        });
      } catch (dbError) {
        console.error("Failed to save revocation to database:", dbError);
        // Don't fail the entire operation if database save fails
      }

      // Only invalidate the specific user query instead of all users
      if (context.user.fid) {
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", context.user.fid],
        });
      }

      setIsRevoking(false);
    } catch (err: any) {
      setIsRevoking(false);
      setIsAllowanceUpdating(false);
      setError(err.message || "Failed to revoke USDC allowance");
      console.error("Revoke error:", err);
    }
  };

  const formatAllowance = (allowance: bigint | undefined): string => {
    if (!allowance) return "0";
    return formatUnits(allowance, 6);
  };

  const currentAllowanceFormatted = formatAllowance(currentAllowance);

  const hasAllowance = currentAllowance ? currentAllowance > BigInt(0) : false;

  const clearError = () => setError("");

  return {
    // State
    isApproving,
    isRevoking,
    error,
    isConnected,
    address,

    // Allowance data
    currentAllowance,
    currentAllowanceFormatted,
    hasAllowance: !!hasAllowance,
    isAllowanceLoading,
    isAllowanceUpdating,

    // Functions
    handleApprove,
    handleRevoke,
    refetchAllowance,
    clearError,
  };
}
