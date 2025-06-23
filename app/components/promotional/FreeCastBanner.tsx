import React from "react";

export default function FreeCastBanner() {
  return (
    <div className="w-[345px] h-[62px] rounded-[20px] border gap-4 pt-[18px] pr-6 pb-[18px] pl-6 bg-gradient-to-r from-[rgba(161,255,206,0.2)] to-[rgba(250,255,209,0.2)] border-[#CFFFE3] flex items-center justify-between">
      <p className="text-[#100c20] font-medium text-base">Free casts</p>
      <p className="text-[#100c20] font-medium text-xl">16 / 20</p>
    </div>
  );
}
