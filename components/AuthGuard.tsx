"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasTwitterAccount, isLoading } = useAuth();

  // Public routes that don't require authentication
  const publicRoutes = ["/"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    console.log("isAuthenticated", isAuthenticated);
    console.log("hasTwitterAccount", hasTwitterAccount);
    console.log("isLoading", isLoading);
    console.log("isPublicRoute", isPublicRoute);

    // Skip auth check for public routes
    if (isPublicRoute || isLoading) return;

    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Redirect to auth if no Twitter account connected
    if (!hasTwitterAccount) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, hasTwitterAccount, isLoading, isPublicRoute, router]);

  // For public routes, always render
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated and has Twitter
  if (isAuthenticated && hasTwitterAccount) {
    return <>{children}</>;
  }

  // Show nothing while loading or redirecting
  return null;
};

export default AuthGuard;
