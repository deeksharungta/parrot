import React from "react";
import { motion } from "framer-motion";

export default function Container({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="border border-[#ECECED] bg-white rounded-3xl p-6"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
    >
      <motion.p
        className="font-semibold text-base text-[#100C20]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {title}
      </motion.p>
      <motion.p
        className="font-normal text-sm text-[#8C8A94]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {description}
      </motion.p>
      <motion.div
        className="my-4 overflow-hidden"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="304"
          height="7"
          viewBox="0 0 304 7"
          fill="none"
        >
          <path
            d="M1 1L7.29164 4.49999C11.2038 6.67629 15.9628 6.6763 19.875 4.5V4.5C23.7871 2.3237 28.5462 2.3237 32.4583 4.5V4.5C36.3705 6.67629 41.1295 6.6763 45.0416 4.5V4.5C48.9538 2.3237 53.7128 2.3237 57.625 4.5V4.5C61.5371 6.6763 66.2961 6.6763 70.2083 4.5V4.5C74.1204 2.3237 78.8795 2.3237 82.7916 4.5V4.5C86.7038 6.6763 91.4628 6.6763 95.375 4.5V4.5C99.2871 2.3237 104.046 2.3237 107.958 4.5V4.5C111.87 6.6763 116.629 6.6763 120.542 4.5V4.5C124.454 2.3237 129.213 2.3237 133.125 4.5V4.5C137.037 6.6763 141.796 6.6763 145.708 4.5V4.5C149.62 2.3237 154.379 2.3237 158.292 4.5V4.5C162.204 6.6763 166.963 6.6763 170.875 4.5V4.5C174.787 2.3237 179.546 2.3237 183.458 4.5V4.5C187.37 6.6763 192.129 6.6763 196.042 4.5V4.5C199.954 2.3237 204.713 2.3237 208.625 4.5V4.5C212.537 6.6763 217.296 6.6763 221.208 4.5V4.5C225.12 2.3237 229.879 2.3237 233.792 4.5V4.5C237.704 6.6763 242.463 6.6763 246.375 4.5V4.5C250.287 2.3237 255.046 2.3237 258.958 4.5V4.5C262.87 6.6763 267.63 6.6763 271.542 4.5V4.5C275.454 2.3237 280.213 2.3237 284.125 4.5V4.5C288.037 6.6763 292.796 6.6763 296.708 4.5L303 1"
            stroke="#E2E2E4"
          />
        </svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
