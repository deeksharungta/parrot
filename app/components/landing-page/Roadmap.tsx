import Image from "next/image";
import React from "react";

export default function Roadmap() {
  return (
    <div>
      <p className="text-black-v1 max-w-[1150px] mx-auto font-zing font-thin text-[90px] leading-[87%] tracking-[-0.15px] text-center mt-28">
        The
        <span className="font-serif font-normal italic">
          {" "}
          Distribution <br />
          Market{" "}
        </span>{" "}
        Is Changing
      </p>
      <p className="text-black mx-auto font-serif font-normal text-sm text-center mt-4">
        Distribution isn&apos;t just reach, it&apos;s about entering new markets
        where every post can earn. Parrot routes your
        <br />
        content to onchain platforms, unlocking likes, tips, collectibles.
      </p>
      <div className="flex items-center justify-center gap-0 mt-2">
        <Image
          src="/landing/parrot-still.svg"
          alt="Parrot"
          width={46}
          height={46}
        />
        <Image
          src="/landing/parrot-still.svg"
          alt="Roadmap"
          width={46}
          height={46}
          className="scale-x-[-1] -ml-1"
        />
      </div>
      <div className="h-[1px] bg-black w-24 mx-auto -mt-1" />
      <div className="relative h-[600px] z-20">
        <div className="relative">
          <div className="grid grid-cols-2 gap-10 mx-auto mt-40 relative z-30">
            <div className="relative mb-10 z-30 ml-80">
              <Image
                src="/landing/page.svg"
                alt="Page"
                width={350}
                height={250}
                className="absolute top-0 left-0 rotate-[5.29deg]"
              />
              <Image
                src="/landing/tape.svg"
                alt="Roadmap"
                width={81}
                height={23}
                className="absolute -top-3 -left-3 rotate-[5.29deg]"
              />
              <p className="font-zing font-thin text-black text-2xl absolute top-7 left-10 rotate-[2.25deg]">
                Now
              </p>
              <p className="font-serif font-normal text-lg absolute top-[5.4rem] left-9 italic text-black rotate-[3deg] leading-[146%]">
                Post from X to Farcaster
                <br />- Pick X posts and cast
                <br />- YOLO mode (set once and forget)
                <br />- Reverse FC account tag
                <br />- Supports threads, long tweets, images, links
              </p>
            </div>
            <div className="relative mb-10 z-30">
              <Image
                src="/landing/page.svg"
                alt="Page"
                width={350}
                height={250}
                className="absolute top-0 left-0"
              />
              <Image
                src="/landing/tape.svg"
                alt="Roadmap"
                width={81}
                height={23}
                className="absolute -top-3 -left-3"
              />
              <p className="font-zing font-thin text-black text-2xl absolute top-9 left-10 -rotate-[3.24deg]">
                Future
              </p>
              <p className="font-serif font-normal text-xl absolute top-[5.4rem] left-10 italic text-black -rotate-[2.49deg] ">
                - X to Lens <br />- Insta to Zora <br />- Medium to Paragraph{" "}
                <br />- Medium to Paragraph
              </p>
            </div>
          </div>
        </div>
        <p className="font-zing font-thin text-black text-[370px] text-center opacity-5 absolute left-1/2 transform -translate-x-1/2 z-0">
          Roadmap
        </p>
      </div>
    </div>
  );
}
