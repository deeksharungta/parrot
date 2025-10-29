"use client";

import Image from "next/image";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const features = [
  {
    feature: "X to Farcaster/Baseapp",
    icon: "/twitter.png",
    backgrounColor: "#000000",
  },
  {
    feature: "Flat fees @0.1 USDC/cast",
    icon: "/usdc.png",
    backgrounColor: "#2875CA",
  },
  {
    feature: "Make edits in the app itself",
    icon: "/farcaster.png",
    backgrounColor: "#7C65C1",
  },
];

export default function WelcomeCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.6,
        ease: "easeOut",
      }}
      style={{
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        perspective: "1000px",
      }}
    >
      <Features />
    </motion.div>
  );
}

const Features = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full gap-5 px-6 -mt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : 0.4,
        delay: shouldReduceMotion ? 0 : 0.2,
      }}
    >
      <SkeletonEffect isLeft={true} delay={shouldReduceMotion ? 0 : 0.2} />
      <div className="bg-white/20 flex flex-col gap-5 p-6 rounded-3xl items-center justify-center">
        <Image
          src="/landing/header-title.webp"
          alt="Parrot"
          width={62}
          height={25}
          unoptimized
        />
        <p className="font-zing text-white text-2xl font-thin text-center">
          Cross-post your X posts to Farcaster in one-click
        </p>
      </div>
      {features.map((feature, index) => (
        <FeatureItem
          key={feature.feature}
          feature={feature.feature}
          icon={feature.icon}
          backgrounColor={feature.backgrounColor}
          delay={shouldReduceMotion ? 0 : 0.3 + index * 0.1}
        />
      ))}
      <SkeletonEffect isLeft={true} delay={shouldReduceMotion ? 0 : 0.6} />
      <SkeletonEffect isLeft={false} delay={shouldReduceMotion ? 0 : 0.7} />
    </motion.div>
  );
};

const FeatureItem = ({
  feature,
  icon,
  backgrounColor,
  delay = 0,
}: {
  feature: string;
  icon: string;
  backgrounColor: string;
  delay?: number;
}) => {
  const isUsdcFeature = icon === "/usdc.png";
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex items-center justify-center w-full gap-3"
      initial={{
        opacity: 0,
        x: shouldReduceMotion ? 0 : isUsdcFeature ? -20 : 20,
        scale: shouldReduceMotion ? 1 : 0.95,
      }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.5,
        delay: shouldReduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
      }
      whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
      style={{
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "translateZ(0)",
      }}
    >
      {isUsdcFeature ? (
        <>
          <motion.div
            className={`h-full w-[86px] bg-[${backgrounColor}] rounded-3xl flex items-center justify-center`}
            style={{
              backgroundColor: backgrounColor,
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            whileHover={
              shouldReduceMotion
                ? {}
                : {
                    rotate: [0, -2, 2, 0],
                    transition: { duration: 0.3 },
                  }
            }
          >
            <Image src={icon} alt={feature} width={40} height={40} />
          </motion.div>
          <div className="bg-[#F3F3F4] py-7 rounded-3xl text-lg font-normal text-[#494656] whitespace-nowrap flex-1 flex items-center justify-center">
            <p>{feature}</p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-[#F3F3F4] py-7 rounded-3xl text-lg font-normal text-[#494656] whitespace-nowrap flex-1 flex items-center justify-center">
            <p>{feature}</p>
          </div>
          <motion.div
            className={`h-full w-[86px] bg-[${backgrounColor}] rounded-3xl flex items-center justify-center`}
            style={{
              backgroundColor: backgrounColor,
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            whileHover={
              shouldReduceMotion
                ? {}
                : {
                    rotate: [0, 2, -2, 0],
                    transition: { duration: 0.3 },
                  }
            }
          >
            <Image src={icon} alt={feature} width={40} height={40} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

const SkeletonEffect = ({
  isLeft,
  delay = 0,
}: {
  isLeft: boolean;
  delay?: number;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex items-center justify-center w-full gap-3 h-[86px] opacity-20"
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
      animate={{ opacity: 0.2, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : 0.4,
        delay: shouldReduceMotion ? 0 : delay,
      }}
      style={{
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
      }}
    >
      {isLeft ? (
        <>
          <div className="h-full w-[86px] bg-[#E2E2E4] rounded-3xl" />
          <div className="h-full w-full flex-1 bg-[#ECECED] rounded-3xl" />
        </>
      ) : (
        <>
          <div className="h-full w-full flex-1 bg-[#ECECED] rounded-3xl" />
          <div className="h-full w-[86px] bg-[#E2E2E4] rounded-3xl" />
        </>
      )}
    </motion.div>
  );
};
