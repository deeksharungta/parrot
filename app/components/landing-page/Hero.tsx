import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Hero() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Sticky Navbar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-2 sm:px-3 md:px-4 ${
          isScrolled
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="relative h-14 sm:h-16 overflow-hidden rounded-full mt-2 max-w-[1440px] mx-auto shadow-lg">
          {/* Background Image */}
          <Image
            src="/landing/header-bg.webp"
            alt="Navbar Background"
            fill
            className="object-cover"
            priority={isScrolled}
            loading={isScrolled ? "eager" : "lazy"}
            quality={90}
            unoptimized
          />
          {/* Parrot Logo */}
          <Image
            src="/landing/header-title.webp"
            alt="Parrot"
            width={120}
            height={58}
            className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 md:left-8 z-10 w-16 h-8 sm:w-20 sm:h-10 md:w-[100px] md:h-[48px]"
            priority={isScrolled}
            loading={isScrolled ? "eager" : "lazy"}
            quality={90}
            unoptimized
          />
          {/* Try Mini App Button */}
          <Link
            target="_blank"
            href="https://farcaster.xyz/miniapps/wttQ9mMjERiS/parrot-for-x"
            className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 md:right-8 font-zing font-thin text-xs sm:text-sm uppercase text-black text-shadow-white z-50 bg-white rounded-full px-4 py-2 pt-3 hover:bg-gray-100 transition-colors"
          >
            Try Mini App
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="w-full max-w-[1392px] h-[640px] sm:h-[400px] md:h-[500px] lg:h-[635px] relative mx-auto mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl overflow-hidden">
        <Image
          src="/landing/header-title.webp"
          alt="Parrot"
          width={120}
          height={58}
          className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 w-16 h-8 sm:w-20 sm:h-10 md:w-[120px] md:h-[58px]"
          priority
          quality={90}
          unoptimized
        />
        <Link
          target="_blank"
          href="https://farcaster.xyz/miniapps/wttQ9mMjERiS/parrot-for-x"
          className="absolute top-3 right-3 sm:top-6 sm:right-6 font-zing font-thin text-xs sm:text-sm uppercase text-black text-shadow-white z-50 bg-white rounded-full px-4 py-2 pt-3"
        >
          Try Mini App
        </Link>
        <p className="font-zing font-thin text-lg sm:text-xl md:text-2xl lg:text-[32px] absolute  top-60 xs:top-40 sm:top-28 md:top-36 lg:top-40 left-1/2 transform -translate-x-1/2 z-10 text-white text-shadow-white text-center tracking-[-7%] px-4 whitespace-nowrap">
          Make your posts work for you
        </p>
        <Image
          src="/landing/parrot-title.webp"
          alt="Hero"
          width={1276}
          height={691}
          className="absolute  hidden md:block md:bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-[600px] sm:w-[400px] md:w-[800px] lg:w-[1276px]"
          priority
          quality={90}
          unoptimized
        />
        <Image
          src="/landing/parrot-title-2.webp"
          alt="Hero"
          width={1276}
          height={691}
          className="absolute top-60 sm:top-20 md:hidden left-1/2 transform -translate-x-1/2 z-10 xs:w-[500px] sm:w-[600px] md:w-[800px] lg:w-[1276px]"
          priority
          quality={90}
          unoptimized
        />
        <Image
          src="/landing/parrot.webp"
          alt="Hero"
          width={400}
          height={400}
          className="absolute hidden md:block top-32 sm:top-40 md:top-48 lg:top-64 xl:top-56 left-1/2 transform -translate-x-1/2 z-10 w-40 sm:w-56 md:w-80 lg:w-[400px]"
          priority
          quality={90}
          unoptimized
        />
        <Image
          src="/landing/cloud-1.webp"
          alt="Hero"
          width={400}
          height={400}
          className="absolute top-32 sm:top-40 md:top-48 lg:top-56 -left-10 sm:-left-16 lg:-left-20 z-20 w-40 sm:w-56 md:w-80 lg:w-[400px] hidden sm:block"
          loading="lazy"
          quality={85}
          unoptimized
        />
        <Image
          src="/landing/cloud-2.webp"
          alt="Hero"
          width={676}
          height={327}
          className="absolute top-0 -right-20 sm:-right-32 md:-right-48 lg:-right-60 z-10 w-80 sm:w-[450px] md:w-[550px] lg:w-[676px] hidden md:block"
          loading="lazy"
          quality={85}
          unoptimized
        />
        <Image
          src="/landing/cloud-3.webp"
          alt="Hero"
          width={674}
          height={326}
          className="absolute -bottom-0 right-0 z-20 w-80 sm:w-[450px] md:w-[550px] lg:w-[674px] hidden md:block"
          loading="lazy"
          quality={85}
          unoptimized
        />
        <Image
          src="/landing/header-bg.webp"
          alt="Hero"
          fill
          className="object-cover object-bottom"
          priority
          quality={90}
          unoptimized
        />
      </div>

      {/* Description Section */}
      <div className="flex flex-col gap-2 px-4 sm:px-6 md:px-8 lg:px-10 mx-auto mt-6 sm:mt-7">
        <p className="text-black-v1 font-zing font-thin text-xl sm:text-2xl">
          Internet Distribution Market
        </p>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-3 font-serif text-black-v2 text-sm font-normal">
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

      {/* Hero Tagline Section */}
      <Image
        src="/landing/hero-tagline.webp"
        alt="Hero Tagline"
        width={1150}
        height={1150}
        className="w-full h-auto mx-auto my-12 sm:my-16 md:my-20 lg:my-24 px-0 sm:px-6"
        loading="lazy"
        quality={90}
        unoptimized
      />
      {/* <p className="text-black-v1 max-w-[1150px] mx-auto font-zing font-thin text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[90px] leading-tight lg:leading-none tracking-[-0.15px] text-center my-12 sm:my-16 md:my-20 lg:my-24 px-4 sm:px-6">
        Connect your{" "}
        <span className="font-serif font-normal relative inline-block">
          Socials
          <Image
            src="/landing/blue-bird.svg"
            alt="Blue Bird"
            width={122}
            height={122}
            className="absolute -top-2 -left-8 sm:-top-6 sm:-left-12 md:-top-8 md:-left-20 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-[122px] xl:h-[122px]  sm:block"
          />
        </span>
        ,&{" "}
        <span className="font-serif font-normal relative inline-block">
          {" "}
          Parrot{" "}
          <Image
            src="/landing/parrot-still.svg"
            alt="Parrot Still"
            width={98}
            height={98}
            className="absolute -top-1 -right-2 sm:-top-2 sm:-right-4 w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-[98px] xl:h-[98px] sm:block"
          />
        </span>{" "}
        fetchs all your{" "}
        <span className="font-serif font-normal relative inline-block">
          {" "}
          posts{" "}
          <Image
            src="/landing/phone.svg"
            alt="Phone"
            width={64}
            height={96}
            className="absolute -top-1 md:-top-1 lg:-top-2 xl:top-1 -right-1 sm:-right-16 lg:-right-28 w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-12 lg:w-24 lg:h-24 xl:w-[64px] xl:h-[96px] "
          />
        </span>{" "}
        to spot what
        <span className="font-serif font-normal"> performs</span>. Pick and{""}
        <span className="font-serif font-normal relative inline-block ml-4 mr-2">
          {" "}
          <Image
            src="/landing/thumbs-up.svg"
            alt="Thumbs Up"
            width={112}
            height={112}
            className="absolute -top-1 -left-16 sm:-top-2 sm:-left-28 md:-left-40 lg:-left-52 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-[112px] xl:h-[112px] sm:block"
          />{" "}
          post{" "}
        </span>
        with{" "}
        <span className="font-serif font-normal relative inline-block">
          {" "}
          <Image
            src="/landing/arrow.svg"
            alt="Arrow"
            width={104}
            height={93}
            className="absolute top-1 -right-6 sm:top-2 sm:-right-10 md:-right-14 w-12 h-11 sm:w-16 sm:h-14 md:w-20 md:h-18 lg:w-24 lg:h-24 xl:w-[104px] xl:h-[93px] sm:block"
          />
          one tap{" "}
        </span>{" "}
        - send
        <span className="font-serif font-normal ml-2"> content </span> to
        <span className="font-serif font-normal"> Farcaster </span> or{""}
        <span className="font-serif font-normal relative inline-block ml-4">
          <Image
            src="/landing/farcaster.svg"
            alt="Farcaster"
            width={98}
            height={98}
            className="absolute top-1 -left-20 sm:top-2 sm:-left-32 md:top-3 md:-left-52 lg:-left-72 w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-[98px] xl:h-[98px] md:block"
          />{" "}
          Zora{" "}
          <Image
            src="/landing/zora.svg"
            alt="Zora"
            width={66}
            height={66}
            className="absolute top-0 -right-3 sm:-right-4 md:-right-6 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-24 lg:h-24 xl:w-[66px] xl:h-[66px] sm:block"
          />
        </span>
        , instantly.
      </p> */}
    </>
  );
}
