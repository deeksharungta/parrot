"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostHogSimpleProvider } from "./components/PostHogSimpleProvider";
import ErrorBoundary from "./components/ErrorBoundary";

// Create QueryClient outside component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Prevent refetch on window focus
      refetchOnMount: false, // Prevent refetch on mount if data is still fresh
      retry: 1, // Reduce retry attempts
    },
  },
});

export function Providers(props: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <PostHogSimpleProvider>
        <NeynarContextProvider
          settings={{
            clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
            defaultTheme: Theme.Light,
            eventsCallbacks: {
              onAuthSuccess: () => {},
              onSignout() {},
            },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
              <MiniKitProvider
                apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                chain={base}
                config={{
                  appearance: {
                    mode: "auto",
                    theme: "mini-app-theme",
                    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
                    logo: process.env.NEXT_PUBLIC_ICON_URL,
                  },
                }}
              >
                {props.children}
              </MiniKitProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </NeynarContextProvider>
      </PostHogSimpleProvider>
    </ErrorBoundary>
  );
}
