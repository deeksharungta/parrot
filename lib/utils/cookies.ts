import { FarcasterUser } from "@/hooks/useSigner";

export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }

  return null;
};

export const setCookie = (
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {},
): void => {
  if (typeof document === "undefined") return;

  const {
    days = 7, // Default to 7 days
    path = "/",
    domain,
    secure = true,
    sameSite = "lax",
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += "; secure";
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
};

export const deleteCookie = (
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {},
): void => {
  if (typeof document === "undefined") return;

  const { path = "/", domain } = options;

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

// Specific functions for Farcaster signer management
export const getFarcasterSignerFromCookie = () => {
  const signerData = getCookie("farcaster_signer");
  if (!signerData) return null;

  try {
    return JSON.parse(signerData);
  } catch (error) {
    console.error("Error parsing Farcaster signer from cookie:", error);
    deleteFarcasterSignerCookie();
    return null;
  }
};

export const setFarcasterSignerCookie = (signerData: FarcasterUser) => {
  setCookie("farcaster_signer", JSON.stringify(signerData), {
    days: 30, // Store for 30 days
    secure: true,
    sameSite: "lax",
  });
};

export const deleteFarcasterSignerCookie = () => {
  deleteCookie("farcaster_signer");
};
