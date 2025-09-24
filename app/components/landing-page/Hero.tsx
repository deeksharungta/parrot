import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Hero() {
  return (
    <>
      <div className=" w-[1392px] h-[635px] relative mx-auto mt-6 rounded-3xl overflow-hidden">
        <Image
          src="/landing/header-title.svg"
          alt="Parrot"
          width={120}
          height={58}
          className="absolute top-4 left-4 z-10"
        />
        <Link
          href="/"
          className="absolute top-6 right-6 z-10 font-zing font-thin text-sm uppercase text-white text-shadow-white"
        >
          Open Mini App
        </Link>
        <p className="font-zing font-thin text-[32px] absolute top-40 left-1/2 transform -translate-x-1/2 z-10 text-white text-shadow-white text-center tracking-[-7%]">
          Make your posts work for you
        </p>
        <Image
          src="/landing/parrot-title.svg"
          alt="Hero"
          width={1276}
          height={691}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10"
        />
        <Image
          src="/landing/parrot.svg"
          alt="Hero"
          width={400}
          height={400}
          className="absolute top-56 left-1/2 transform -translate-x-1/2 z-10"
        />
        <Image
          src="/landing/cloud-1.svg"
          alt="Hero"
          width={400}
          height={400}
          className="absolute top-56 -left-20 z-20"
        />
        <Image
          src="/landing/cloud-2.svg"
          alt="Hero"
          width={676}
          height={327}
          className="absolute top-0 -right-60 z-10"
        />
        <Image
          src="/landing/cloud-3.svg"
          alt="Hero"
          width={674}
          height={326}
          className="absolute -bottom-0 right-0 z-20"
        />
        <Image
          src="/landing/header-bg.svg"
          alt="Hero"
          fill
          className="object-cover object-bottom"
        />
      </div>
      <div className="flex flex-col gap-2 px-10 mx-auto mt-7">
        <p className="text-black-v1 font-zing font-thin text-2xl">
          Internet Distribution Market
        </p>
        <div className="grid gap-3 grid-cols-3 font-serif text-black-v2 text-sm font-normal">
          <p>
            Parrot is built on a simple thesis: distribution isn&apos;t just a
            channel, it&apos;s a market. As content spreads across Twitter,
            Farcaster, Lens, and emerging onchain platforms, each of these
            networks acts like its own economic surface. The same post can have
            zero impact on Twitter but generate tips or onchain value on
            Farcaster. In this new internet economy, content isn&apos;t just
            something you publish, it&apos;s an asset that can travel across
            markets. Distribution is no longer about reach, it&apos;s about
            maximizing yield.
          </p>
          <p>
            Parrot helps creators and projects capture that value. It&apos;s not
            just a cross-poster, it&apos;s your distribution engine. Parrot lets
            you publish across multiple networks in one go, automates
            distribution, and tracks engagement and onchain earnings by
            platform. One post, many markets, all routed by Parrot. It helps you
            turn content into capital, surfacing new ways to earn from the
            audiences already waiting across different ecosystems.
          </p>
          <p>
            In this new era, attention is money — and Parrot helps you fly
            further. For creators, companies, and startups building onchain,
            Parrot unlocks the true potential of internet distribution. Instead
            of content trapped on one feed, Parrot makes it portable,
            measurable, and monetizable across platforms. It&apos;s the
            distribution layer the onchain internet has been missing and every
            post can now find its market.
          </p>
        </div>
      </div>
      <p className="text-black-v1 max-w-[1150px] mx-auto font-zing font-thin text-[90px] leading-none tracking-[-0.15px] text-center my-24">
        Connect your{" "}
        <span className="font-serif font-normal relative">
          Socials
          <Image
            src="/landing/blue-bird.svg"
            alt="Blue Bird"
            width={122}
            height={122}
            className="absolute -top-8 -left-20"
          />
        </span>
        ,&
        <span className="font-serif font-normal relative">
          {" "}
          Parrot{" "}
          <Image
            src="/landing/parrot-still.svg"
            alt="Parrot Still"
            width={98}
            height={98}
            className="absolute -top-2 -right-4"
          />
        </span>{" "}
        fetchs all your
        <span className="font-serif font-normal relative">
          {" "}
          posts{" "}
          <Image
            src="/landing/phone.svg"
            alt="Phone"
            width={64}
            height={96}
            className="absolute top-2 -right-28"
          />
        </span>{" "}
        to spot what
        <span className="font-serif font-normal"> performs</span>. Pick and
        <span className="font-serif font-normal relative">
          {" "}
          <Image
            src="/landing/thumbs-up.svg"
            alt="Thumbs Up"
            width={112}
            height={112}
            className="absolute -top-2 -left-52"
          />
          post{" "}
        </span>
        with{" "}
        <span className="font-serif font-normal relative">
          {" "}
          <Image
            src="/landing/arrow.svg"
            alt="Arrow"
            width={104}
            height={93}
            className="absolute top-2 -right-14"
          />
          one tap{" "}
        </span>{" "}
        - send
        <span className="font-serif font-normal"> content </span> to
        <span className="font-serif font-normal relative">
          {" "}
          <Image
            src="/landing/farcaster.svg"
            alt="Farcaster"
            width={98}
            height={98}
            className="absolute top-0 left-0"
          />
          Farcaster{" "}
        </span>{" "}
        or
        <span className="font-serif font-normal relative">
          {" "}
          Zora{" "}
          <Image
            src="/landing/zora.svg"
            alt="Zora"
            width={66}
            height={66}
            className="absolute top-0 -right-6"
          />
        </span>
        , instantly.
      </p>
    </>
  );
}
