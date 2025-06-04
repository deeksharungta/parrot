"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import React from "react";

export default function Header({ title }: { title: string }) {
  const { context } = useMiniKit();

  return (
    <div className="flex items-center justify-between sticky top-0 bg-white z-10 p-5">
      <p className="font-medium text-2xl text-[#494656]">{title}</p>
      <Image
        src={context?.user?.pfpUrl ?? "/farcaster.png"}
        alt="close"
        width={30}
        height={30}
        className="rounded-full"
      />
    </div>
  );
}
