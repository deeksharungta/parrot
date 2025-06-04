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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECECED] py-6 px-16">
      <motion.div className="flex justify-between items-center">
        {navItems.map((item, index) => (
          <motion.div
            key={item.href}
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
    </div>
  );
}
