import Image from "next/image";
import React from "react";

export default function NoTweetsFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full border border-[#ECECED] rounded-3xl p-6 gap-4">
      <Image src="/cross.png" alt="cross" width={56} height={56} />
      <p className="text-sm text-[#494656] text-center">
        No new tweets to cast. Go stir things up on the blue bird and come back!
      </p>
    </div>
  );
}
