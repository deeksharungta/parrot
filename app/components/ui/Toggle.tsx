import React from "react";
import { motion } from "framer-motion";

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between w-full py-3">
      <div className="flex-1">
        <label className="text-[#100C20] font-medium text-sm">{label}</label>
        {description && (
          <p className="text-[#8C8A94] text-xs mt-1">{description}</p>
        )}
      </div>
      <motion.button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#100C20]" : "bg-[#ECECED]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && onChange(!checked)}
        whileTap={disabled ? {} : { scale: 0.95 }}
        disabled={disabled}
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
}
