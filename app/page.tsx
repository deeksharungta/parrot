"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/frame-sdk";
import axios from "axios";
import { AxiosError } from "axios";
import { ErrorRes } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { useNeynarContext } from "@neynar/react";
import Image from "next/image";

export default function HomePage() {
  const { user } = useNeynarContext();
  const { setFrameReady, isFrameReady } = useMiniKit();
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  const handlePublishCast = async () => {
    try {
      await axios.post<{ message: string }>("/api/cast", {
        signerUuid: user?.signer_uuid,
        text,
      });
      alert("Cast Published!");
      setText("");
    } catch (err) {
      const { message } = (err as AxiosError).response?.data as ErrorRes;
      alert(message);
    }
  };

  return (
    <div>
      {!user && (
        <button
          onClick={() =>
            sdk.actions.openUrl("https://xcast-sepia.vercel.app/auth")
          }
        >
          Login
        </button>
      )}

      {user && (
        <>
          <div className="flex flex-col gap-4 w-96 p-4 rounded-md shadow-md">
            <div className="flex items-center gap-4">
              {user.pfp_url && (
                <Image
                  src={user.pfp_url}
                  width={40}
                  height={40}
                  alt="User Profile Picture"
                  className="rounded-full"
                />
              )}
              <p className="text-lg font-semibold">{user?.display_name}</p>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say Something"
              rows={5}
              className="w-full p-2 rounded-md shadow-md text-black placeholder:text-gray-900"
            />
          </div>
          <button
            onClick={handlePublishCast}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors duration-200 ease-in-out"
          >
            Cast
          </button>
        </>
      )}
    </div>
  );
}
