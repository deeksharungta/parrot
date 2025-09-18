import React from "react";
import Hero from "./Hero";
import Features from "./Features";
import FAQ from "./FAQ";
import Roadmap from "./Roadmap";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <Features />
      <Roadmap />
      <FAQ />
      <Footer />
    </div>
  );
}
