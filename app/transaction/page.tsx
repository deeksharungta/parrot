// "use client";

// import { useMiniKit } from "@coinbase/onchainkit/minikit";
// import React, { useEffect, useState } from "react";
// import { sdk } from "@farcaster/frame-sdk";
// import axios from "axios";
// import { useNeynarContext } from "@neynar/react";
// import Image from "next/image";
// import { LoadingSpinner } from "@/app/components/LoadingSpinner";
// import { TweetCard } from "@/app/components/TweetCard";

// interface DbUser {
//   id: string;
//   farcaster_fid: number;
//   farcaster_username: string;
//   farcaster_display_name: string;
//   twitter_username: string | null;
//   neynar_signer_uuid: string;
// }

// interface Tweet {
//   id: string;
//   content: string;
//   twitter_created_at: string | null;
//   twitter_url: string | null;
//   cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
//   is_edited: boolean;
// }

// type AppState =
//   | "loading"
//   | "no-user"
//   | "no-twitter"
//   | "monitoring"
//   | "tweets-loaded";

// export default function HomePage() {
//   const { user } = useNeynarContext();
//   const { setFrameReady, isFrameReady } = useMiniKit();

//   const [appState, setAppState] = useState<AppState>("loading");
//   const [dbUser, setDbUser] = useState<DbUser | null>(null);
//   const [tweets, setTweets] = useState<Tweet[]>([]);
//   const [loadingMessage, setLoadingMessage] = useState("Initializing...");

//   useEffect(() => {
//     if (!isFrameReady) {
//       setFrameReady();
//     }
//   }, [isFrameReady, setFrameReady]);

//   useEffect(() => {
//     if (user && isFrameReady) {
//       initializeUser();
//     }
//   }, [user, isFrameReady]);

//   const initializeUser = async () => {
//     try {
//       setLoadingMessage("Checking Farcaster profile...");
//       setAppState("loading");

//       // Save/update user and get verified Twitter account
//       const userResponse = await axios.post("/api/user", {
//         fid: user?.fid,
//         signerUuid: user?.signer_uuid,
//       });

//       const { user: savedUser, verifiedTwitter } = userResponse.data;
//       setDbUser(savedUser);

//       if (!verifiedTwitter?.username) {
//         setAppState("no-twitter");
//         return;
//       }

//       // Start Twitter monitoring
//       setLoadingMessage("Connecting to Twitter...");
//       await axios.post("/api/twitter/monitor", {
//         userId: savedUser.id,
//         twitterUsername: verifiedTwitter.username,
//       });

//       // Fetch tweets
//       setLoadingMessage("Loading your tweets...");
//       await fetchTweets(savedUser.id);

//       setAppState("tweets-loaded");
//     } catch (error) {
//       console.error("Error initializing user:", error);
//       setAppState("no-user");
//     }
//   };

//   const fetchTweets = async (userId: string) => {
//     try {
//       const response = await axios.get(`/api/twitter/monitor?userId=${userId}`);
//       setTweets(response.data.tweets);
//     } catch (error) {
//       console.error("Error fetching tweets:", error);
//     }
//   };

//   const handleTweetAction = async (
//     tweetId: string,
//     action: "approve" | "reject",
//   ) => {
//     try {
//       await axios.post("/api/tweets/action", {
//         tweetId,
//         action,
//         signerUuid: user?.signer_uuid,
//       });

//       // Refresh tweets
//       if (dbUser) {
//         await fetchTweets(dbUser.id);
//       }
//     } catch (error) {
//       console.error("Error processing tweet action:", error);
//       alert("Failed to process tweet action");
//     }
//   };

//   const handleRefreshTweets = async () => {
//     if (!dbUser) return;

//     setLoadingMessage("Refreshing tweets...");
//     setAppState("loading");

//     try {
//       await axios.post("/api/twitter/monitor", {
//         userId: dbUser.id,
//         twitterUsername: dbUser.twitter_username,
//       });

//       await fetchTweets(dbUser.id);
//       setAppState("tweets-loaded");
//     } catch (error) {
//       console.error("Error refreshing tweets:", error);
//       setAppState("tweets-loaded");
//     }
//   };

//   // Loading state
//   if (appState === "loading") {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <LoadingSpinner text={loadingMessage} />
//       </div>
//     );
//   }

//   // No user state
//   if (appState === "no-user" || !user) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
//         <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full text-center">
//           <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <span className="text-2xl">👋</span>
//           </div>
//           <h1 className="text-xl font-bold text-gray-900 mb-2">
//             Welcome to XCast
//           </h1>
//           <p className="text-gray-600 mb-6 text-sm">
//             Connect your Farcaster account to get started
//           </p>
//           <button
//             onClick={() =>
//               sdk.actions.openUrl("https://xcast-sepia.vercel.app/auth")
//             }
//             className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
//           >
//             Connect Farcaster
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // No Twitter account state
//   if (appState === "no-twitter") {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
//         <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full text-center">
//           <div className="flex items-center gap-3 mb-4">
//             {user?.pfp_url && (
//               <Image
//                 src={user.pfp_url}
//                 width={48}
//                 height={48}
//                 alt="Profile"
//                 className="rounded-full"
//               />
//             )}
//             <div className="text-left">
//               <p className="font-semibold text-gray-900">
//                 {user?.display_name}
//               </p>
//               <p className="text-sm text-gray-500">@{user?.username}</p>
//             </div>
//           </div>

//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <span className="text-2xl">🐦</span>
//           </div>

//           <h2 className="text-xl font-bold text-gray-900 mb-2">
//             Twitter Account Required
//           </h2>
//           <p className="text-gray-600 mb-6 text-sm">
//             Please verify your Twitter account on Farcaster to use XCast
//           </p>
//           <button
//             onClick={() =>
//               window.open(
//                 "https://warpcast.com/~/settings/verified-accounts",
//                 "_blank",
//               )
//             }
//             className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
//           >
//             Verify Twitter Account
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Tweets loaded state
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
//         <div className="max-w-md mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               {user?.pfp_url && (
//                 <Image
//                   src={user.pfp_url}
//                   width={32}
//                   height={32}
//                   alt="Profile"
//                   className="rounded-full"
//                 />
//               )}
//               <div>
//                 <p className="font-semibold text-gray-900 text-sm">
//                   {user?.display_name}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   @{dbUser?.twitter_username}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={handleRefreshTweets}
//               className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
//             >
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-md mx-auto p-4">
//         {tweets.length === 0 ? (
//           <div className="bg-white rounded-xl p-6 text-center shadow-sm">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <span className="text-2xl">📱</span>
//             </div>
//             <h3 className="text-lg font-semibold text-gray-900 mb-2">
//               No tweets found
//             </h3>
//             <p className="text-gray-600 text-sm mb-4">
//               We couldn't find any recent tweets from your Twitter account
//             </p>
//             <button
//               onClick={handleRefreshTweets}
//               className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
//             >
//               Check Again
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             <div className="text-center mb-4">
//               <h2 className="text-lg font-semibold text-gray-900">
//                 Your Recent Tweets
//               </h2>
//               <p className="text-sm text-gray-600">Tap to cast to Farcaster</p>
//             </div>

//             {tweets.map((tweet) => (
//               <TweetCard
//                 key={tweet.id}
//                 tweet={tweet}
//                 userProfileImage={user?.pfp_url}
//                 userName={user?.display_name}
//                 onCastApprove={(tweetId) =>
//                   handleTweetAction(tweetId, "approve")
//                 }
//                 onCastReject={(tweetId) => handleTweetAction(tweetId, "reject")}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React from "react";

export default function page() {
  return <div>page</div>;
}
