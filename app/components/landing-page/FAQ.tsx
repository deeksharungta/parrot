"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Is Parrot free?",
    answer:
      "No, Parrot isn't free. We charge $0.10 per cast, on a pay-per-cast model — meaning if you post less, you pay less, and if you post more, you pay more.",
  },
  {
    question: "What platforms and content types are supported?",
    answer:
      "Parrot supports threads, links, images, and embedded links — everything works smoothly when you cross-post on Farcaster (FC). Currently, video support is not yet available.",
  },
  {
    question: "How do tags work in Parrot?",
    answer:
      "Parrot automatically tags posts based on connected social accounts: We inverse search FC accounts for their connected Twitter (X) accounts. If a Twitter account is linked to an FC profile, Parrot auto-tags it when cross-posting. We also maintain a large internal library of social accounts from both FC and X — even for users who haven't connected their X to FC — so Parrot can auto-bind and tag seamlessly for a better user experience.",
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 mb-20 sm:mb-28 md:mb-32 lg:mb-36">
      <h3 className="font-zing font-thin text-xl sm:text-2xl mb-5 sm:mb-7">
        Frequently asked questions
      </h3>
      {faqData.map((faq, index) => (
        <div
          key={index}
          className={`border-black ${
            index === 0 ? "border-t-[0.25px]" : ""
          } border-b-[0.25px]`}
        >
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full flex items-center justify-between py-4 sm:py-5 hover:opacity-70 transition-opacity"
          >
            <h4 className="font-serif font-normal text-left text-lg sm:text-xl md:text-2xl lg:text-[32px] pr-4">
              {faq.question}
            </h4>
            <span className="font-serif font-normal text-2xl sm:text-3xl lg:text-[32px] flex-shrink-0 transition-transform duration-300">
              {expandedIndex === index ? "−" : "+"}
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedIndex === index ? "max-h-96 pb-4 sm:pb-6" : "max-h-0"
            }`}
          >
            <p className="font-serif font-normal text-sm sm:text-base text-black-v2 pr-12">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
