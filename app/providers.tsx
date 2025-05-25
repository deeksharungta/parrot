"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { PrivyProvider } from "@privy-io/react-auth";

export function Providers(props: { children: ReactNode }) {
  return (
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
      {/* 
     {/* <PrivyProvider */}
      {/* //   appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
    //   config={{ */}
      {/* //     // Create embedded wallets for users who don't have a wallet
    //     loginMethods: ["farcaster"],
    //     embeddedWallets: { */}
      {/* //       ethereum: { */}
      {/* //         createOnLogin: "all-users",
    //       },
    //       solana: { */}
      {/* //         createOnLogin: "all-users",
    //       },
    //     },
    //   }}
    // > */}
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
      {/* // </PrivyProvider> */}
    </NeynarContextProvider>
  );
}
