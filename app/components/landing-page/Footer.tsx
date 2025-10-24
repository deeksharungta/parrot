import Image from "next/image";
import React from "react";

export default function Footer() {
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-center flex-col relative overflow-hidden ">
      <p className="font-zing font-thin text-xs sm:text-sm uppercase text-center mb-8 sm:mb-10 md:mb-14">
        © Parrot.click — farcaster
      </p>
      <div className="w-full max-w-[1340px] relative">
        <Image
          src="/landing/footer-title.svg"
          alt="Parrot"
          width={1340}
          height={545}
          className="w-full h-auto"
        />
        <Image
          src="/landing/parrot-still.svg"
          alt="Parrot"
          width={534}
          height={534}
          className="absolute -bottom-14 sm:-bottom-24 md:-bottom-48 lg:-bottom-56 right-2 sm:right-4 md:right-6 lg:right-10 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 lg:w-[534px] lg:h-[534px]"
        />
      </div>
    </div>
  );
}
