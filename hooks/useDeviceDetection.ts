import { useState, useEffect } from "react";

// Utility function to detect mobile devices
const detectMobileDevice = () => {
  if (typeof window === "undefined") {
    console.log("🔍 Mobile Detection: Window undefined (SSR)");
    return false;
  }

  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for mobile user agents
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const userAgentMatch = mobileRegex.test(userAgent);

  // Also check for touch capability and screen size
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  const isMobile = userAgentMatch || (isTouchDevice && isSmallScreen);

  console.log("🔍 Mobile Detection:", {
    userAgent: userAgent,
    userAgentMatch,
    isTouchDevice,
    isSmallScreen,
    windowWidth: window.innerWidth,
    maxTouchPoints: navigator.maxTouchPoints,
    finalResult: isMobile ? "📱 MOBILE" : "💻 DESKTOP",
  });

  return isMobile;
};

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileResult = detectMobileDevice();
      console.log(
        "📱 Setting mobile state:",
        isMobileResult ? "MOBILE" : "DESKTOP",
      );
      setIsMobile(isMobileResult);
    };

    console.log("🔄 Mobile detection useEffect triggered");
    checkMobile(); // Check on mount

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile, isDesktop: !isMobile };
};
