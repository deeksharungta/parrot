"use client";

import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { useEffect } from "react";
import { useGetUser, useUpsertUser } from "@/hooks/useUsers";

export default function App() {
  const { user, logoutUser } = useNeynarContext();
  const upsertUser = useUpsertUser();
  const { data: userFromDb } = useGetUser(user?.fid);

  const handleLogout = async () => {
    if (!user) return; // Guard against null user

    try {
      const userUpdateData = {
        farcaster_fid: user.fid,
        neynar_signer_uuid: null,
      };

      const data = await upsertUser.mutateAsync(userUpdateData);
      logoutUser();
      console.log("User saved to database:", data);
    } catch (error) {
      console.error("Error saving user:", error);
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

        const data = await upsertUser.mutateAsync(userUpdateData);
        console.log("User saved to database:", data);
      } catch (error) {
        console.error("Error saving user:", error);
      }
    };

    if (user) {
      saveUserToDatabase();
    }
  }, [user, upsertUser, userFromDb]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {user ? (
        <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
          <button onClick={handleLogout}>Sign out</button>
        </div>
      ) : (
        <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
          <NeynarAuthButton />
        </div>
      )}
    </main>
  );
}
