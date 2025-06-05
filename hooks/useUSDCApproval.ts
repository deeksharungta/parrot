import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { erc20Abi, parseUnits, formatUnits } from "viem";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constant";

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

    setError("");
    setIsRevoking(true);

    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SPENDER_ADDRESS, BigInt(0)], // Set allowance to 0 to revoke
      });

      // Wait for transaction confirmation
      // Note: You might want to add transaction receipt waiting here if needed

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
  const hasAllowance = currentAllowance && currentAllowance > BigInt(0);

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
