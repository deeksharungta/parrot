import Image from "next/image";
import React from "react";

export default function Roadmap() {
  return (
    <div className="px-4 sm:px-6">
      <p className="text-black-v1 max-w-[1150px] mx-auto font-zing font-thin text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[90px] leading-tight lg:leading-[87%] tracking-[-0.15px] text-center mt-16 sm:mt-20 md:mt-24 lg:mt-28">
        The
        <span className="font-serif font-normal italic">
          {" "}
          Distribution <br />
          Market{" "}
        </span>{" "}
        Is Changing
      </p>
      <p className="text-black mx-auto font-serif font-normal text-sm text-center mt-4 px-4">
        Distribution isn&apos;t just reach, it&apos;s about entering new markets
        where every post can earn. Parrot routes your
        <br className="hidden sm:block" />
        content to onchain platforms, unlocking likes, tips, collectibles.
      </p>
      <div className="flex items-center justify-center gap-0 mt-2">
        <Image
          src="/landing/parrot-still.svg"
          alt="Parrot"
          width={46}
          height={46}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-[46px] md:h-[46px]"
        />
        <Image
          src="/landing/parrot-still.svg"
          alt="Roadmap"
          width={46}
          height={46}
          className="scale-x-[-1] -ml-1 w-8 h-8 sm:w-10 sm:h-10 md:w-[46px] md:h-[46px]"
        />
      </div>
      <div className="h-[1px] bg-black w-16 sm:w-20 md:w-24 mx-auto -mt-1" />
      <div className="relative h-auto sm:h-[400px] md:h-[500px] lg:h-[600px] z-20 overflow-hidden">
        <div className="relative">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mx-auto mt-10 sm:mt-20 md:mt-32 lg:mt-40 relative z-30 max-w-5xl px-4">
            <div className="relative mb-10 lg:mb-10 z-30 mx-auto lg:ml-auto lg:mr-0 w-full max-w-[350px]">
              <Image
                src="/landing/page.svg"
                alt="Page"
                width={350}
                height={250}
                className="w-full h-auto rotate-[5.29deg]"
              />
              <Image
                src="/landing/tape.svg"
                alt="Roadmap"
                width={81}
                height={23}
                className="absolute -top-3 -left-3 rotate-[5.29deg] w-16 sm:w-20 md:w-[81px] h-auto"
              />
              <p className="font-zing font-thin text-black text-lg sm:text-xl md:text-2xl absolute top-5 sm:top-7 left-6 sm:left-8 md:left-10 rotate-[2.25deg]">
                Now
              </p>
              <p className="font-serif font-normal text-base sm:text-sm lg:text-lg absolute top-16 sm:top-16 lg:top-[5.4rem] left-6 sm:left-8 md:left-9 italic text-black rotate-[3deg] leading-[146%]">
                Post from X to Farcaster and Baseapp <br />- Pick X posts and
                cast <br />- YOLO mode (set once and forget) <br />- Reverse FC
                account tag <br />- Supports threads, long tweets, images, links
              </p>
            </div>
            <div className="relative mb-10 lg:mb-10 z-30 mx-auto lg:ml-0 lg:mr-auto w-full max-w-[350px]">
              <Image
                src="/landing/page.svg"
                alt="Page"
                width={350}
                height={250}
                className="w-full h-auto"
              />
              <Image
                src="/landing/tape.svg"
                alt="Roadmap"
                width={81}
                height={23}
                className="absolute -top-3 -left-3 w-16 sm:w-20 md:w-[81px] h-auto"
              />
              <p className="font-zing font-thin text-black text-lg sm:text-xl md:text-2xl absolute top-6 sm:top-8 md:top-9 left-6 sm:left-8 md:left-10 -rotate-[3.24deg]">
                Future
              </p>
              <p className="font-serif font-normal text-base sm:text-sm lg:text-lg absolute top-16 sm:top-16 lg:top-[5.4rem] left-6 sm:left-8 md:left-9 italic text-black -rotate-[2.49deg]">
                - Insta to Zora(in beta right now) <br />- Medium to Paragraph{" "}
                <br />- and much more(TBD)
              </p>
            </div>
          </div>
        </div>
        <p className="font-zing font-thin text-black text-[120px] sm:text-[180px] md:text-[200px] lg:text-[370px] text-center opacity-5 absolute left-1/2 transform -translate-x-1/2 top-60 sm:top-32 md:top-60 lg:top-20 z-0 whitespace-nowrap">
          Roadmap
        </p>
      </div>
    </div>
  );
}
