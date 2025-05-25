"use client";

import { NeynarAuthButton } from "@neynar/react";

export default function App() {
  // const { ready, login, user, logout } = usePrivy();

  // const { requestFarcasterSignerFromWarpcast } = useFarcasterSigner();

  // Call setFrameReady() when your app is ready to be shown

  // // Usage
  // const handleSignIn = async () => {
  //   const result = await SignIn();

  //   if (result) {
  //     // Handle successful authentication
  //     console.log("Authenticated:", result);
  //   }
  // };

  // if (!ready) {
  //   return <div>Loading...</div>;
  // }

  // const handleSignIn = async () => {
  //   login();
  // };

  // const handleAuthenticate = async () => {
  //   const signer = await requestFarcasterSignerFromWarpcast();
  //   console.log(signer);
  // };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        {/* <button onClick={handleSignIn}>Sign In</button>
        {user && <p>{user.farcaster?.fid}</p>}
        {user && <button onClick={handleAuthenticate}>Authenticate</button>}
        {user && <button onClick={logout}>Logout</button>} */}
        <NeynarAuthButton />
      </div>
    </main>
  );
}
