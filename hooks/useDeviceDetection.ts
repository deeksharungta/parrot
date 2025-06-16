import { useState, useEffect } from "react";

// Utility function to detect mobile devices
const detectMobileDevice = () => {
  if (typeof window === "undefined") {
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

  return isMobile;
};

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileResult = detectMobileDevice();

      setIsMobile(isMobileResult);
    };

    checkMobile(); // Check on mount

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile, isDesktop: !isMobile };
};
