"use client";

import React from "react";
import { motion } from "framer-motion";
import { analytics } from "@/lib/analytics";

interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onDragStart"
    | "onDragEnd"
    | "onDrag"
    | "onDragEnter"
    | "onDragExit"
    | "onDragLeave"
    | "onDragOver"
    | "onDrop"
  > {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "red";
  isLoading?: boolean;
  // Analytics tracking props
  trackingName?: string;
  trackingLocation?: string;
  trackingProperties?: Record<string, any>;
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  isLoading = false,
  disabled,
  trackingName,
  trackingLocation,
  trackingProperties,
  onClick,
  ...props
}: ButtonProps) {
  const baseClasses =
    "rounded-full font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed font-sans w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-black text-white shadow-[0px_-4px_0px_0px_#343434_inset] disabled:bg-black/50 disabled:shadow-none",
    secondary:
      "bg-[#FFE0E0] text-[#DE2424] border border-[#F03D3D] disabled:bg-[#FFE0E0]/50",
    red: "bg-[#F03D3D] text-white shadow-danger-top disabled:bg-[#F03D3D]/50 disabled:shadow-none",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track analytics if tracking props are provided
    if (trackingName && trackingLocation) {
      analytics.trackButtonClick(trackingName, trackingLocation, {
        variant,
        ...trackingProperties,
      });
    }

    // Call the original onClick handler
    onClick?.(e);
  };

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || isLoading}
      whileHover={
        disabled || isLoading
          ? {}
          : {
              scale: 1.02,
              y: -1,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
      }
      whileTap={
        disabled || isLoading
          ? {}
          : {
              scale: 0.98,
              y: 0,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
      }
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          Loading...
        </motion.div>
      ) : (
        <motion.p
          className="flex items-center justify-center gap-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {children}
        </motion.p>
      )}
    </motion.button>
  );
}
