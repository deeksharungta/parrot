import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { erc20Abi, parseUnits, formatUnits } from "viem";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constant";
import { useUpdateUser } from "./useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const { writeContractAsync } = useWriteContract();
  const updateUser = useUpdateUser();
  const { context } = useMiniKit();
  const queryClient = useQueryClient();

  const { address, isConnected } = useAccount();

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: address && SPENDER_ADDRESS ? [address, SPENDER_ADDRESS] : undefined,
      query: {
        enabled: !!address,
      },
    },
  );

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

    try {
      // Convert spending limit to USDC amount (6 decimals)
      const amountBigInt = parseUnits(amount.toString(), 6);
      console.log(amountBigInt);
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SPENDER_ADDRESS, amountBigInt],
      });

      // Save approval to Supabase users table
      try {
        await updateUser.mutateAsync({
          farcaster_fid: context.user.fid,
          wallet_address: address,
          spending_approved: true,
          spending_limit: amount,
          usdc_balance: amount, // Set initial balance to spending limit
        });
        console.log("Approval saved to database");
      } catch (dbError) {
        console.error("Failed to save approval to database:", dbError);
        // Don't fail the entire operation if database save fails
      }

      // Invalidate all related queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["users"] });

      // Show success toast
      toast(`USDC Approved!`, {
        description: `$${amount} spending limit set successfully`,
      });

      setIsApproving(false);
      refetchAllowance();
    } catch (err: any) {
      setIsApproving(false);
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

    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SPENDER_ADDRESS, BigInt(0)], // Set allowance to 0 to revoke
      });

      // Save revocation to Supabase users table
      try {
        await updateUser.mutateAsync({
          farcaster_fid: context.user.fid,
          wallet_address: address,
          spending_approved: false,
          spending_limit: 0,
          usdc_balance: 0, // Reset balance when revoking
        });
        console.log("Revocation saved to database");
      } catch (dbError) {
        console.error("Failed to save revocation to database:", dbError);
        // Don't fail the entire operation if database save fails
      }

      // Invalidate all related queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["users"] });

      // Show success toast
      toast("USDC Revoked!", {
        description: "Spending allowance removed successfully",
      });

      setIsRevoking(false);
      refetchAllowance();
    } catch (err: any) {
      setIsRevoking(false);
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

    // Functions
    handleApprove,
    handleRevoke,
    refetchAllowance,
    clearError,
  };
}
