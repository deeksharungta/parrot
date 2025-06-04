"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

export default function Header({ title }: { title: string }) {
  const { context } = useMiniKit();

  return (
    <motion.div
      className="flex items-center justify-between sticky top-0 bg-white z-10 p-5"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.p
        className="font-medium text-2xl text-[#494656]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {title}
      </motion.p>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-full overflow-hidden"
      >
        <Image
          src={context?.user?.pfpUrl ?? "/farcaster.png"}
          alt="profile"
          width={30}
          height={30}
          className="rounded-full"
        />
      </motion.div>
    </motion.div>
  );
}
