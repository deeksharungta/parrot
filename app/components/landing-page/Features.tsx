import Image from "next/image";
import React from "react";

export default function Features() {
  return (
    <div className="px-10 ">
      <h3 className="font-zing font-thin text-2xl text-center mb-9">
        Features
      </h3>
      <div className="grid grid-cols-3 gap-10 text-center w-fit mx-auto">
        <div className="border-black border w-fit ">
          <Image
            src="/landing/feature-1.svg"
            alt="Pick"
            width={424}
            height={415}
          />
          <h4 className="font-serif text-[32px] mt-6">Pick and cast.</h4>
          <p className="font-serif font-normal text-sm mb-6">
            Choose your favorite posts and cast them instantly on FC. <br />
            Stay in control of what you share and when.
          </p>
        </div>
        <div className="border-black border w-fit ">
          <Image
            src="/landing/feature-2.svg"
            alt="Pick"
            width={424}
            height={415}
          />
          <h4 className="font-serif text-[32px] mt-6">YOLO mode.</h4>
          <p className="font-serif font-normal text-sm mb-6">
            Turn on auto-cast and let the system post for you—no
            <br /> approvals needed. It stops when your allowance runs out.
          </p>
        </div>
        <div className="border-black border w-fit ">
          <Image
            src="/landing/feature-3.svg"
            alt="Pick"
            width={424}
            height={415}
          />
          <h4 className="font-serif text-[32px] mt-6">Micropayments.</h4>
          <p className="font-serif font-normal text-sm mb-6">
            Monitor your earnings and reach across all <br />
            supported platforms in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
