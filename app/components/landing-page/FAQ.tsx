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
      "Parrot offers a free tier with basic features. You can connect your accounts and start cross-posting to Farcaster right away. For advanced features like YOLO mode and increased posting limits, we offer premium plans.",
  },
  {
    question: "How does Parrot work?",
    answer:
      "Parrot automatically fetches your posts from Twitter and other connected platforms. You can then select which posts to share on Farcaster with a single tap. The app handles all the formatting, media conversion, and posting for you.",
  },
  {
    question: "What platforms does Parrot support?",
    answer:
      "Currently, Parrot supports cross-posting from Twitter/X to Farcaster. We're actively working on expanding to support Lens, Zora, Medium to Paragraph, and Instagram to Zora. Check our roadmap for upcoming integrations.",
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
