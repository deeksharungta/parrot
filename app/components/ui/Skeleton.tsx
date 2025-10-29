import React from "react";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Skeleton({ className = "", children }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-label="Loading..."
    >
      {children}
    </div>
  );
}

// Specific skeleton components for common use cases
export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 mb-2 ${index === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 w-full ${className}`} />;
}

export function SkeletonCircle({
  size = "w-8 h-8",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return <Skeleton className={`rounded-full ${size} ${className}`} />;
}
