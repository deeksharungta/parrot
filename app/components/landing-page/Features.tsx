import Image from "next/image";
import React from "react";

export default function Features() {
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10">
      <h3 className="font-zing font-thin text-xl sm:text-2xl text-center mb-6 sm:mb-9">
        Features
      </h3>
      <div className="lg:grid flex flex-col lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 text-center max-w-7xl mx-auto">
        <div className="border-black border w-full max-w-xs mx-auto">
          <Image
            src="/landing/feature-1.svg"
            alt="Pick"
            width={424}
            height={415}
            className="w-full h-auto"
          />
          <h4 className="font-serif text-2xl sm:text-3xl lg:text-[32px] mt-4 sm:mt-6 px-4">
            Pick and cast.
          </h4>
          <p className="font-serif font-normal text-sm mb-4 sm:mb-6 px-4 max-w-xs mx-auto">
            Choose your favorite posts and cast them instantly on FC. Stay in
            control of what you share and when.
          </p>
        </div>
        <div className="border-black border w-full max-w-xs mx-auto">
          <Image
            src="/landing/feature-2.svg"
            alt="Pick"
            width={424}
            height={415}
            className="w-full h-auto"
          />
          <h4 className="font-serif text-2xl sm:text-3xl lg:text-[32px] mt-4 sm:mt-6 px-4">
            YOLO mode.
          </h4>
          <p className="font-serif font-normal text-sm mb-4 sm:mb-6 px-4 max-w-xs mx-auto">
            Turn on auto-cast and let the system post for you—no approvals
            needed. It stops when your allowance runs out.
          </p>
        </div>
        <div className="border-black border w-full max-w-xs mx-auto">
          <Image
            src="/landing/feature-3.svg"
            alt="Pick"
            width={424}
            height={415}
            className="w-full h-auto"
          />
          <h4 className="font-serif text-2xl sm:text-3xl lg:text-[32px] mt-4 sm:mt-6 px-4">
            Micropayments.
          </h4>
          <p className="font-serif font-normal text-sm mb-4 sm:mb-6 px-4 max-w-xs mx-auto">
            Monitor your earnings and reach across all supported platforms in
            one place.
          </p>
        </div>
      </div>
    </div>
  );
}
