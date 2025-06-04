import Image from "next/image";
import React from "react";

const features = [
  {
    feature: "Post tweets to Farcaster",
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
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Features />
    </div>
  );
}

const Features = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-5 px-6">
      <SkeletonEffect isLeft={false} />
      <SkeletonEffect isLeft={true} />
      {features.map((feature) => (
        <FeatureItem
          key={feature.feature}
          feature={feature.feature}
          icon={feature.icon}
          backgrounColor={feature.backgrounColor}
        />
      ))}
      <SkeletonEffect isLeft={true} />
      <SkeletonEffect isLeft={false} />
    </div>
  );
};

const FeatureItem = ({
  feature,
  icon,
  backgrounColor,
}: {
  feature: string;
  icon: string;
  backgrounColor: string;
}) => {
  const isUsdcFeature = icon === "/usdc.png";

  return (
    <div className="flex items-center justify-center w-full gap-3">
      {isUsdcFeature ? (
        <>
          <div
            className={`h-full w-[86px] bg-[${backgrounColor}] rounded-3xl flex items-center justify-center`}
            style={{ backgroundColor: backgrounColor }}
          >
            <Image src={icon} alt={feature} width={40} height={40} />
          </div>
          <div className="bg-[#F3F3F4] py-7 rounded-3xl text-lg font-normal text-[#494656] whitespace-nowrap flex-1 flex items-center justify-center">
            <p>{feature}</p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-[#F3F3F4] py-7 rounded-3xl text-lg font-normal text-[#494656] whitespace-nowrap flex-1 flex items-center justify-center">
            <p>{feature}</p>
          </div>
          <div
            className={`h-full w-[86px] bg-[${backgrounColor}] rounded-3xl flex items-center justify-center`}
            style={{ backgroundColor: backgrounColor }}
          >
            <Image src={icon} alt={feature} width={40} height={40} />
          </div>
        </>
      )}
    </div>
  );
};

const SkeletonEffect = ({ isLeft }: { isLeft: boolean }) => {
  return (
    <div className="flex items-center justify-center w-full gap-3 h-[86px] opacity-20">
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
    </div>
  );
};
