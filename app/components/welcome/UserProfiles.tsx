"use client";

import React, { useEffect, useRef } from "react";
import Button from "../ui/Button";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGetTwitterAccount } from "@/hooks/useGetTwitterAccount";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useCreateUser,
  useGetUser,
  UserInsert,
  useCurrentUser,
} from "@/hooks/useUsers";
import { useSignIn } from "@/hooks/useSignIn";
import sdk from "@farcaster/frame-sdk";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { toast } from "sonner";

const SkeletonLoader = ({ width = "w-16" }: { width?: string }) => (
  <motion.div
    className={`h-4 ${width} bg-gray-200 rounded`}
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  />
);

export default function UserProfiles() {
  const { context } = useMiniKit();
  const { isMobile } = useDeviceDetection();
  const { signIn, isSignedIn, isLoading: isSignInLoading } = useSignIn();
  const { refetch: refetchUser } = useCurrentUser();
  const { twitterAccount, isLoading, isError } = useGetTwitterAccount(
    context?.user?.fid,
  );
  const { data: userData } = useGetUser(context?.user?.fid);
  const createUserMutation = useCreateUser();
  const signInAttempted = useRef(false);

  // Handle sign-in flow - only attempt once if not already signed in
  useEffect(() => {
    if (isSignedIn) {
      refetchUser();
    } else if (!signInAttempted.current && !isSignInLoading && !isSignedIn) {
      // Only attempt sign-in if we're not loading and not already signed in
      signInAttempted.current = true;
      signIn().catch((error) => {
        console.error("Sign-in failed:", error);
        toast.error("Authentication failed. Please try again.");
      });
    }
  }, [isSignedIn, refetchUser, signIn, isSignInLoading]);

  // Create user in database when context is available and user doesn't exist
  useEffect(() => {
    if (
      context?.user?.fid &&
      userData &&
      !userData.exists &&
      !createUserMutation.isPending &&
      twitterAccount?.username
    ) {
      const userToCreate: UserInsert = {
        farcaster_fid: context.user.fid,
        farcaster_username: context.user.username || null,
        farcaster_display_name: context.user.displayName || null,
        twitter_username: twitterAccount?.username || null,
      };

      createUserMutation.mutate(userToCreate, {
        onSuccess: (response) => {
          console.log("User created successfully:", response.user);
        },
        onError: (error) => {
          console.error("Failed to create user:", error.message);
        },
      });
    }
  }, [context?.user, userData, createUserMutation, twitterAccount?.username]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full px-6 py-8 bg-white border-t border-[#ECECED] absolute bottom-0 left-0 right-0"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="flex justify-between items-center w-full mb-2.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.0 }}
      >
        <motion.div
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Image
            src="/farcaster.png"
            alt="farcaster"
            width={20}
            height={20}
            className="aspect-square rounded"
          />
          <p className="text-sm font-normal text-[#8C8A94]">
            @{context?.user?.username}
          </p>
        </motion.div>
        <motion.div
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Image
            src="/twitter.png"
            alt="twitter"
            width={20}
            height={20}
            className="aspect-square rounded"
          />
          {isLoading ? (
            <SkeletonLoader width="w-20" />
          ) : isError ? (
            <motion.p
              className="text-sm font-normal text-red-500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Error loading
            </motion.p>
          ) : (
            <motion.p
              className="text-sm font-normal text-[#8C8A94]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {twitterAccount?.username
                ? `@${twitterAccount?.username}`
                : "Not Connected"}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        {twitterAccount?.username ? (
          !isSignedIn ? (
            <Button
              disabled={isLoading || isSignInLoading}
              onClick={() => signIn()}
            >
              {isSignInLoading
                ? "Signing you in..."
                : isLoading
                  ? "Checking authentication..."
                  : "Sign In"}
            </Button>
          ) : (
            <Link href="/cast" className="w-full">
              <Button
                disabled={
                  isLoading || !twitterAccount?.username || isSignInLoading
                }
              >
                {isSignInLoading
                  ? "Signing you in..."
                  : isLoading
                    ? "Checking authentication..."
                    : "Continue fetching tweets"}
              </Button>
            </Link>
          )
        ) : (
          <>
            <Button
              disabled={isLoading || isSignInLoading}
              onClick={() => {
                if (!isSignedIn) {
                  signIn();
                } else {
                  sdk.actions.openUrl(
                    isMobile
                      ? "https://farcaster.xyz/~/settings/verifications"
                      : "https://farcaster.xyz/~/settings",
                  );
                }
              }}
            >
              {isSignInLoading
                ? "Signing you in..."
                : isLoading
                  ? "Checking authentication..."
                  : !isSignedIn
                    ? "Sign In"
                    : "Connect X to FC"}
            </Button>
            <p className="text-xs text-center font-normal text-[#8C8A94] mt-1">
              To get started, connect your X account to Farcaster. We'll fetch
              your posts automatically once it's linked.
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
