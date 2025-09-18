import React, { useState } from "react";
import { motion } from "framer-motion";
import Container from "../ui/Container";

export default function XUsername() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [preferences, setPreferences] = useState({
    profileLink: true,
    username: false,
    usernameWithLink: false,
    firstName: false,
    fullName: false,
  });

  const handleToggleChange = (
    key: keyof typeof preferences,
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const CustomToggle = ({
    children,
    checked,
    onChange,
  }: {
    children: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between w-full py-3">
      <div className="flex-1">
        <div className="text-sm">{children}</div>
      </div>
      <motion.button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#100C20]" : "bg-[#ECECED]"
        } cursor-pointer`}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          } shadow-sm`}
          layout
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </motion.button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#ECECED] overflow-hidden">
      <motion.button
        className="w-full p-6 "
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-full flex items-center justify-between text-left  transition-colors">
          <div>
            <h3 className="text-[#100C20] font-semibold text-lg mb-1">
              X @username preference
            </h3>
            <p className="text-[#8C8A94] text-sm">
              Set your preferences for X mentions
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#8C8A94]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>
        {isExpanded && (
          <motion.div className="my-4 overflow-hidden ">
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
        )}
      </motion.button>
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="overflow-hidden mx-auto"
      >
        <div className="px-6 pb-6 space-y-1">
          <CustomToggle
            checked={preferences.profileLink}
            onChange={(value) => handleToggleChange("profileLink", value)}
          >
            <span className="text-[#100C20] font-medium">x.com/elonmusk</span>
            <span className="text-[#8C8A94] ml-1">profile link</span>
          </CustomToggle>

          <CustomToggle
            checked={preferences.username}
            onChange={(value) => handleToggleChange("username", value)}
          >
            <span className="text-[#100C20] font-medium">elonmusk</span>
            <span className="text-[#8C8A94] ml-1">username</span>
          </CustomToggle>

          <CustomToggle
            checked={preferences.usernameWithLink}
            onChange={(value) => handleToggleChange("usernameWithLink", value)}
          >
            <span className="text-[#100C20] font-medium">
              elonmusk(x.com/elonmusk)
            </span>
            <span className="text-[#8C8A94] ml-1">username(link)</span>
          </CustomToggle>

          <CustomToggle
            checked={preferences.firstName}
            onChange={(value) => handleToggleChange("firstName", value)}
          >
            <span className="text-[#100C20] font-medium">Elon</span>
            <span className="text-[#8C8A94] ml-1">first name</span>
          </CustomToggle>

          <CustomToggle
            checked={preferences.fullName}
            onChange={(value) => handleToggleChange("fullName", value)}
          >
            <span className="text-[#100C20] font-medium">Elon Musk</span>
            <span className="text-[#8C8A94] ml-1">full name</span>
          </CustomToggle>
        </div>
      </motion.div>
    </div>
  );
}
