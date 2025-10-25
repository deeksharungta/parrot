import React, { memo, useMemo } from "react";
import Hero from "./Hero";
import Features from "./Features";
import FAQ from "./FAQ";
import Roadmap from "./Roadmap";
import Footer from "./Footer";

function LandingPage() {
  // Memoize the entire landing page to prevent re-renders
  return useMemo(
    () => (
      <div className="max-w-[1440px] mx-auto w-full px-4">
        <Hero />
        <Features />
        <Roadmap />
        <FAQ />
        <Footer />
      </div>
    ),
    [],
  );
}

export default memo(LandingPage);
