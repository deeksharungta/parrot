import React from "react";

export default function Hero() {
  return (
    <>
      <div className="flex flex-col gap-2 px-10">
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
      <p className="text-black-v1 max-w-[1150px] mx-auto font-zing font-thin text-[90px] leading-none tracking-[-0.15px] text-center">
        Connect your <span className="font-serif font-normal">Socials</span>,&
        <span className="font-serif font-normal"> Parrot</span> fetchs all your
        <span className="font-serif font-normal"> posts </span> to spot what
        <span className="font-serif font-normal"> performs</span>. Pick and
        <span className="font-serif font-normal"> post </span>
        with <span className="font-serif font-normal"> one tap </span> - send
        <span className="font-serif font-normal"> content </span> to
        <span className="font-serif font-normal"> Farcaster </span> or
        <span className="font-serif font-normal"> Zora</span>, instantly.
      </p>
    </>
  );
}
