import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Viewport } from "next";
import { Toaster } from "sonner";
import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import * as Sentry from "@sentry/nextjs";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description: "Make your post work for you",
    openGraph: {
      title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      description: "Make your post work for you",
      images: [`${URL}/hero.png`],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${URL}/hero.png`,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: `${URL}/splash.png`,
            splashBackgroundColor: "#4998D1",
          },
        },
      }),
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${instrumentSerif.variable}`}
    >
      <body className="font-sans antialiased bg-white text-gray-900">
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #ECECED",
              borderRadius: "16px",
              color: "#100C20",
              fontFamily: "var(--font-outfit)",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              boxShadow: "0px 0px 0px 0px",
            },
          }}
          closeButton={false}
          richColors
          expand={false}
          offset={16}
        />
        <Analytics />
      </body>
    </html>
  );
}
