"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import Approval from "../icons/Approval";
import Cast from "../icons/Cast";
import Settings from "../icons/Settings";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/cast", component: Cast, isActive: pathname === "/cast" },
    {
      href: "/approval",
      component: Approval,
      isActive: pathname === "/approval",
    },
    {
      href: "/settings",
      component: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECECED] py-6 px-16"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {navItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
            whileHover={{
              scale: 1.1,
              y: -2,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
            whileTap={{
              scale: 0.95,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
          >
            <Link href={item.href}>
              <item.component isActive={item.isActive} />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
