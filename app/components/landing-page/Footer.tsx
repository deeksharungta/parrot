import Image from "next/image";
import React from "react";

export default function Footer() {
  return (
    <div className="px-10 flex items-center justify-center flex-col relative">
      <p className="font-zing font-thin text-sm uppercase text-center ">
        © Parrot.click — farcaster
      </p>
      <Image
        src="/landing/footer-title.svg"
        alt="Parrot"
        width={1340}
        height={545}
      />
      <Image
        src="/landing/parrot-still.svg"
        alt="Parrot"
        width={534}
        height={534}
        className="absolute -bottom-56 right-10"
      />
    </div>
  );
}
