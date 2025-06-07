"use client";

import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { useEffect, useState } from "react";
import { useGetUser, useUpsertUser } from "@/hooks/useUsers";
import { motion } from "framer-motion";
import Image from "next/image";
import Button from "@/app/components/ui/Button";

export default function AuthPage() {
  const { user, logoutUser } = useNeynarContext();
  const upsertUser = useUpsertUser();
  const { data: userFromDb } = useGetUser(user?.fid);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!user) return;
    setIsLoggingOut(true);

    try {
      const userUpdateData = {
        farcaster_fid: user.fid,
        neynar_signer_uuid: null,
      };

      await upsertUser.mutateAsync(userUpdateData);
      logoutUser();
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const saveUserToDatabase = async () => {
      if (!user) return;

      if (userFromDb?.user?.neynar_signer_uuid) {
        return;
      }

      try {
        const userUpdateData = {
          farcaster_fid: user.fid,
          neynar_signer_uuid: user.signer_uuid,
        };

        await upsertUser.mutateAsync(userUpdateData);
        console.log("User saved to database successfully");
      } catch (error) {
        console.error("Error saving user:", error);
      }
    };

    if (user) {
      saveUserToDatabase();
    }
  }, [user, upsertUser, userFromDb]);

  const steps = [
    {
      number: 1,
      title: "Connect to Farcaster",
      description: "Click the sign in button below to start the process",
    },
    {
      number: 2,
      title: "Grant Permissions",
      description: "Authorize the app to access your Farcaster account",
    },
    {
      number: 3,
      title: "Return & Confirm",
      description: "You'll be redirected back to confirm your connection",
    },
    {
      number: 4,
      title: "Open Mini App",
      description: "Start cross-posting your tweets to Farcaster",
    },
  ];

  if (user) {
    return (
      <motion.main
        className="flex min-h-screen flex-col items-center justify-center p-6 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Success Header */}
          <motion.div
            className="text-center space-y-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                delay: 0.4,
                stiffness: 200,
                damping: 15,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              >
                ✓
              </motion.div>
            </motion.div>
            <motion.h1
              className="text-2xl font-semibold text-gray-900"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Successfully Connected!
            </motion.h1>
            <motion.p
              className="text-gray-600"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Welcome back, @{user.username}
            </motion.p>
          </motion.div>

          {/* User Info Card */}
          <motion.div
            className="bg-[#F3F3F4] rounded-3xl p-6 space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={user.pfp_url || "/farcaster.png"}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </motion.div>
              <div>
                <p className="font-medium text-gray-900">{user.display_name}</p>
                <p className="text-sm text-gray-600">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Image
                src="/farcaster.png"
                alt="Farcaster"
                width={16}
                height={16}
              />
              <span>FID: {user.fid}</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="space-y-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.a
              href="/"
              className="block w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button>Open Mini App</Button>
            </motion.a>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="secondary"
                onClick={handleLogout}
                isLoading={isLoggingOut}
              >
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="flex min-h-screen flex-col items-center justify-center p-6 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-md space-y-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto bg-[#7C65C1] rounded-full flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              delay: 0.4,
              stiffness: 200,
              damping: 15,
            }}
          >
            <Image
              src="/farcaster.png"
              alt="Farcaster"
              width={32}
              height={32}
            />
          </motion.div>
          <motion.h1
            className="text-2xl font-semibold text-gray-900"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Connect to Farcaster
          </motion.h1>
          <motion.p
            className="text-gray-600"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Sign in with your Farcaster account to start cross-posting your
            tweets
          </motion.p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            How it works:
          </h2>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${"bg-gray-50"}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              onHoverStart={() => setCurrentStep(step.number)}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${"bg-white text-gray-600 border border-gray-200"}`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {step.number}
              </motion.div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Auth Button */}
        <motion.div
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex justify-center"
          >
            <NeynarAuthButton />
          </motion.div>

          <motion.p
            className="text-xs text-gray-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            By connecting, you agree to our terms and privacy policy
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
