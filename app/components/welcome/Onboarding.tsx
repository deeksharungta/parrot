"use client";

import Edit from "../icons/Edit";
import ArrowRight from "../icons/ArrowRight";
import Cross from "../icons/Cross";
import Image from "next/image";
import Button from "../ui/Button";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

export default function Onboarding({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    // Track onboarding page view
    analytics.trackPageView("onboarding", {
      step: "welcome_screen",
    });
  }, []);

  const handleContinue = () => {
    // Track onboarding completion
    analytics.trackEvent("onboarding_completed", {
      completion_time: Date.now(),
      step: "welcome_screen",
    });

    localStorage.setItem("onboardingCompleted", "true");
    onContinue();
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
        <div className="w-[calc(100%-20px)] h-full rounded-3xl bg-[#F8F8F8] border border-[#ECECED] absolute -top-4 left-1/2 -translate-x-1/2 z-0" />
        <div className="w-[calc(100%-6px)] h-full rounded-3xl bg-[#F8F8F8] border border-[#ECECED] absolute -top-2 left-1/2 -translate-x-1/2 z-0" />
        <div className="absolute inset-0 z-10">
          <div className="w-full h-full bg-white rounded-3xl border border-[#ECECED] flex flex-col items-center justify-between p-6">
            <p className="font-semibold text-base text-[#100C20] text-center">
              Welcome to Parrot
            </p>
            <Image
              src="/onboarding-screen.svg"
              alt="Onboarding"
              width={200}
              height={180}
            />
            <p className="text-[#494656] text-center text-sm">
              swipe right to cast, left to ignore, or swipe up to edit
            </p>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="118"
                height="5"
                viewBox="0 0 118 5"
                fill="none"
              >
                <path
                  d="M0.5 4.60791L3.47173 2.10982C5.77061 0.17734 9.1614 0.238958 11.4131 2.22618V2.22618C13.679 4.22583 17.1033 4.24721 19.3691 2.24756V2.24756C21.6349 0.247905 25.035 0.247906 27.3009 2.24756V2.24756C29.5667 4.24721 32.9668 4.24721 35.2326 2.24756V2.24756C37.4984 0.247906 40.8985 0.247906 43.1643 2.24756V2.24756C45.4302 4.24721 48.8303 4.24721 51.0961 2.24756V2.24756C53.3619 0.247905 56.762 0.247905 59.0278 2.24756V2.24756C61.2937 4.24721 64.6938 4.24721 66.9596 2.24756V2.24756C69.2254 0.247905 72.6255 0.247908 74.8913 2.24756V2.24756C77.1572 4.24721 80.5573 4.24721 82.8231 2.24756V2.24756C85.0889 0.247906 88.489 0.247907 90.7548 2.24756V2.24756C93.0207 4.24721 96.4208 4.24721 98.6866 2.24756V2.24756C100.952 0.247905 104.353 0.247905 106.618 2.24756L106.888 2.4858C109.067 4.40834 112.267 4.62265 114.682 3.00779L117.524 1.10791"
                  stroke="#E2E2E4"
                />
              </svg>
              <p className="text-[#B3B1B8] text-sm">or</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="118"
                height="5"
                viewBox="0 0 118 5"
                fill="none"
              >
                <path
                  d="M0.5 4.60791L3.47173 2.10982C5.77061 0.17734 9.1614 0.238958 11.4131 2.22618V2.22618C13.679 4.22583 17.1033 4.24721 19.3691 2.24756V2.24756C21.6349 0.247905 25.035 0.247906 27.3009 2.24756V2.24756C29.5667 4.24721 32.9668 4.24721 35.2326 2.24756V2.24756C37.4984 0.247906 40.8985 0.247906 43.1643 2.24756V2.24756C45.4302 4.24721 48.8303 4.24721 51.0961 2.24756V2.24756C53.3619 0.247905 56.762 0.247905 59.0278 2.24756V2.24756C61.2937 4.24721 64.6938 4.24721 66.9596 2.24756V2.24756C69.2254 0.247905 72.6255 0.247908 74.8913 2.24756V2.24756C77.1572 4.24721 80.5573 4.24721 82.8231 2.24756V2.24756C85.0889 0.247906 88.489 0.247907 90.7548 2.24756V2.24756C93.0207 4.24721 96.4208 4.24721 98.6866 2.24756V2.24756C100.952 0.247905 104.353 0.247905 106.618 2.24756L106.888 2.4858C109.067 4.40834 112.267 4.62265 114.682 3.00779L117.524 1.10791"
                  stroke="#E2E2E4"
                />
              </svg>
            </div>
            <div className="flex justify-between items-center px-6 py-3 gap-6 w-fit bg-[#F8F8F8] rounded-3xl">
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-full bg-[#ECECED] p-2.5 flex items-center justify-center hover:bg-[#ECECED] transition-colors">
                  <Cross className="w-4 h-4" />
                </div>
                <p className="text-[#B3B1B8] text-[10px]">Ignore</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-full bg-[#ECECED] p-2.5 flex items-center justify-center hover:bg-[#ECECED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Edit className="w-4 h-4" />
                </div>
                <p className="text-[#B3B1B8] text-[10px]">Edit</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-full bg-[#ECECED] p-2.5 flex items-center justify-center hover:bg-[#ECECED] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-[#B3B1B8] text-[10px]">Cast</p>
              </div>
            </div>
            <p className="text-[#494656] text-center text-sm">
              click on any of the buttons to do the particular action
            </p>
            <Button
              className="w-full"
              onClick={handleContinue}
              trackingName="continue_onboarding"
              trackingLocation="onboarding_screen"
              trackingProperties={{ step: "welcome_screen" }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
