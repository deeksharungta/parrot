"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import Approval from "../icons/Approval";
import Cast from "../icons/Cast";
import Settings from "../icons/Settings";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECECED] py-6 px-16">
      <div className="flex justify-between items-center">
        <Link href="/cast">
          <Cast isActive={pathname === "/cast"} />
        </Link>
        <Link href="/approval">
          <Approval isActive={pathname === "/approval"} />
        </Link>
        <Link href="/settings">
          <Settings isActive={pathname === "/settings"} />
        </Link>
      </div>
    </div>
  );
}
