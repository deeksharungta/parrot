"use client";

import { useEffect, useState } from "react";
import { useSignIn } from "@/hooks/useSignIn";
import { useCurrentUser, useUpdateUser } from "@/hooks/useUsers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function Demo() {
  const { signIn, logout, isSignedIn, isLoading, error } = useSignIn();
  const { data: user, refetch: refetchUser } = useCurrentUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { isFrameReady } = useMiniKit();
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    refetchUser();
  }, [isSignedIn, refetchUser]);

  if (!isFrameReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-2">
      <a
        href="https://builders.garden"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4"
      >
        <img
          src="/images/builders-garden-logo.png"
          alt="Builders Garden"
          className="h-8"
        />
      </a>

      <h1 className="text-2xl font-bold">Frames v2 demo</h1>

      <p className="text-sm text-gray-500 text-center max-w-md mb-4">
        This demo is made for developers to quickly get started with Frames v2
        integration
      </p>

      {error && <p className="text-red-500">{error}</p>}

      {!isSignedIn ? (
        <button
          onClick={() => signIn()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {isLoading ? "Signing in..." : "Sign in with Farcaster"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {user && (
            <div className="text-center text-white">
              <img
                src={
                  user.user?.farcaster_display_name
                    ? `https://api.farcaster.xyz/user/${user.user.farcaster_fid}/pfp`
                    : "/images/default-avatar.png"
                }
                alt={user.user?.farcaster_username || "User"}
                className="w-16 h-16 rounded-full mx-auto mb-2"
              />
              <p className="font-medium">
                Welcome, {user.user?.farcaster_username || "User"}
              </p>
              <p className="text-gray-600">FID: {user.user?.farcaster_fid}</p>
              <p className="text-gray-600">
                {user.user?.farcaster_display_name || "No display name set"}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter display name"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-black"
                />
                <button
                  onClick={() => {
                    if (user.user?.farcaster_fid) {
                      updateUser(
                        {
                          farcaster_fid: user.user.farcaster_fid,
                          farcaster_display_name: customName,
                        },
                        {
                          onSuccess: () => {
                            refetchUser();
                          },
                        },
                      );
                      setCustomName("");
                    }
                  }}
                  disabled={isUpdating || !customName}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
                >
                  {isUpdating ? "Updating..." : "Update Display Name"}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="mt-8 px-4 py-2 bg-red-500 w-full text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
