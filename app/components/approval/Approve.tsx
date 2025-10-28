"use client";

import React, { useState } from "react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Dollar from "../icons/Dollar";
import { useUSDCApproval } from "@/hooks/useUSDCApproval";
import { Loader2 } from "lucide-react";

export default function Approve() {
  const [spendingLimit, setSpendingLimit] = useState(10);
  const presetLimits = [1, 10, 25, 50, 100, 500];

  const { isApproving, isConnected, handleApprove, currentAllowanceFormatted } =
    useUSDCApproval();

  const onApprove = () => {
    handleApprove(spendingLimit);
  };

  return (
    <Container
      title="Approve USDC"
      description="set a spending limit for parrot. You can top up anytime, and we'll notify you when it's running low."
    >
      <div className="text-left">
        <div className="flex justify-between items-center mb-4">
          <p className="text-base font-medium text-[#8C8A94]">spending limit</p>
          <p className="text-[#100C20] text-2xl font-medium">
            {currentAllowanceFormatted}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {presetLimits.map((limit) => (
            <button
              key={limit}
              onClick={() => setSpendingLimit(limit)}
              className={`p-2 border rounded-full text-base font-medium transition-colors border-[#E2E2E4] flex items-center justify-center gap-1 group ${
                spendingLimit === limit
                  ? "bg-black text-white"
                  : "bg-[#F8F8F8] text-[#100C20] hover:bg-black hover:text-white"
              }`}
            >
              {limit} <Dollar isActive={spendingLimit === limit} />
            </button>
          ))}
        </div>
      </div>

      <Button
        className="flex items-center justify-center gap-1"
        onClick={onApprove}
        disabled={!isConnected || isApproving}
      >
        {isApproving ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Approve ${spendingLimit} <Dollar isActive />
          </>
        )}
      </Button>

      <p className="text-[#8C8A94] text-xs font-normal text-center px-5 mt-1">
        ${spendingLimit} covers nearly {Math.floor(spendingLimit * 10)} casts —
        enough for {spendingLimit === 1 ? "10 days" : "1 month"} if you cast{" "}
        {spendingLimit === 1 ? "1" : Math.floor(spendingLimit / 3)} time
        {spendingLimit === 1
          ? ""
          : Math.floor(spendingLimit / 3) > 1
            ? "s"
            : ""}{" "}
        a day.
      </p>
    </Container>
  );
}
