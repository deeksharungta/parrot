import React from "react";
import { motion } from "framer-motion";

export default function Cross({ className }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      whileHover={{ rotate: 90 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      <motion.path
        d="M6 18L12 12M12 12L18 6M12 12L6 6M12 12L18 18"
        stroke="#111111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
