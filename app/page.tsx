// "use client";

// import { useMiniKit } from "@coinbase/onchainkit/minikit";
// import React, { useEffect, useState } from "react";
// import { useNeynarContext } from "@neynar/react";

// // Components
// import { WelcomePage } from "./components/WelcomePage";
// import { TwitterVerificationPage } from "./components/TwitterVerificationPage";
// import { TwitterNotVerifiedPage } from "./components/TwitterNotVerifiedPage";
// import { ReadyToMonitorPage } from "./components/ReadyToMonitorPage";
// import { MonitoringPage } from "./components/MonitoringPage";
// import { TweetDashboardPage } from "./components/TweetDashboardPage";
// import { SettingsPage } from "./components/SettingsPage";
// import { SignerModal } from "./components/SignerModal";
// import { EditModal } from "./components/EditModal";
// import { SuccessModal } from "./components/SuccessModal";

// // Types
// interface Tweet {
//   id: string;
//   content: string;
//   twitter_created_at: string | null;
//   twitter_url: string | null;
//   cast_status: "pending" | "approved" | "rejected" | "cast" | "failed";
//   is_edited: boolean;
// }

// interface VerifiedAccount {
//   platform: string;
//   username: string;
// }

// interface NeynarUser {
//   fid: number;
//   username: string;
//   display_name: string;
//   pfp_url: string;
//   verified_accounts: VerifiedAccount[];
//   verified_addresses: {
//     eth_addresses: string[];
//     sol_addresses: string[];
//   };
// }

// interface NeynarUserResponse {
//   users: NeynarUser[];
// }

// type AppState =
//   | "connecting"
//   | "checking-twitter"
//   | "twitter-not-verified"
//   | "ready-to-monitor"
//   | "monitoring"
//   | "tweet-dashboard"
//   | "settings";

// export default function HomePage() {
//   const { setFrameReady, isFrameReady, context } = useMiniKit();

//   // App state
//   const [appState, setAppState] = useState<AppState>("connecting");
//   const [signerUuid, setSignerUuid] = useState("");
//   const [tweets, setTweets] = useState<Tweet[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [yoloMode, setYoloMode] = useState(false);
//   const [notifications, setNotifications] = useState(false);
//   const [twitterUsername, setTwitterUsername] = useState("");
//   const [error, setError] = useState("");
//   const [spendingApproved, setSpendingApproved] = useState(false);
//   const [spendingLimit, setSpendingLimit] = useState(0);

//   // Modal states
//   const [showSignerModal, setShowSignerModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [pendingAction, setPendingAction] = useState<"cast" | "yolo" | null>(
//     null,
//   );
//   const [pendingTweetId, setPendingTweetId] = useState("");
//   const [editingTweet, setEditingTweet] = useState<Tweet | null>(null);
//   const [successCastUrl, setSuccessCastUrl] = useState("");

//   useEffect(() => {
//     if (!isFrameReady) {
//       setFrameReady();
//     }
//   }, [isFrameReady, setFrameReady]);

//   useEffect(() => {
//     if (context?.user) {
//       checkTwitterVerification();
//     }
//   }, [context?.user]);

//   const checkTwitterVerification = async () => {
//     if (!context?.user?.fid) {
//       setError("Unable to get user FID");
//       return;
//     }

//     setAppState("checking-twitter");
//     setError("");

//     try {
//       const response = await fetch(`/api/neynar/user?fid=${context.user.fid}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch user data");
//       }

//       const userData: NeynarUserResponse = await response.json();
//       const user = userData.users[0];

//       if (!user) {
//         throw new Error("User not found");
//       }

//       const twitterAccount = user.verified_accounts.find(
//         (account) => account.platform === "x" || account.platform === "twitter",
//       );

//       if (twitterAccount) {
//         setTwitterUsername(twitterAccount.username);
//         setAppState("ready-to-monitor");
//       } else {
//         setAppState("twitter-not-verified");
//       }
//     } catch (error) {
//       console.error("Error checking Twitter verification:", error);
//       setError("Failed to verify Twitter account. Please try again.");
//       setAppState("twitter-not-verified");
//     }
//   };

//   const startMonitoring = async () => {
//     setAppState("monitoring");
//     setIsLoading(true);

//     try {
//       const response = await fetch("/api/twitter/monitor", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           fid: context?.user?.fid,
//           twitterUsername,
//           signerUuid: signerUuid || "temp",
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to start monitoring");
//       }

//       const tweetsResponse = await fetch(
//         `/api/tweets?fid=${context?.user?.fid}`,
//       );
//       const tweetsData = await tweetsResponse.json();

//       setTweets(tweetsData.tweets || []);
//       setIsLoading(false);
//       setAppState("tweet-dashboard");
//     } catch (error) {
//       console.error("Error starting monitoring:", error);
//       setError("Failed to start monitoring. Please try again.");
//       setIsLoading(false);
//       setAppState("ready-to-monitor");
//     }
//   };

//   const handleCastRequest = (tweetId: string) => {
//     if (!spendingApproved) {
//       setError("Please approve USDC spending first to cast tweets");
//       return;
//     }
//     if (!signerUuid) {
//       setPendingAction("cast");
//       setPendingTweetId(tweetId);
//       setShowSignerModal(true);
//       return;
//     }
//     handleCastNow(tweetId);
//   };

//   const handleYoloToggle = () => {
//     if (!spendingApproved && !yoloMode) {
//       setError("Please approve USDC spending first to enable YOLO mode");
//       return;
//     }
//     if (!signerUuid && !yoloMode) {
//       setPendingAction("yolo");
//       setShowSignerModal(true);
//       return;
//     }
//     setYoloMode(!yoloMode);
//   };

//   const handleSignerSubmit = async (signerUuidInput: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`/api/user/${context?.user?.fid}/signer`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ signerUuid: signerUuidInput }),
//       });

//       if (response.ok) {
//         setSignerUuid(signerUuidInput);
//         setShowSignerModal(false);

//         if (pendingAction === "cast" && pendingTweetId) {
//           handleCastNow(pendingTweetId);
//         } else if (pendingAction === "yolo") {
//           setYoloMode(true);
//         }

//         setPendingAction(null);
//         setPendingTweetId("");
//       }
//     } catch (error) {
//       console.error("Error saving signer UUID:", error);
//       setError("Failed to save signer UUID. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCastNow = async (tweetId: string) => {
//     setIsLoading(true);

//     try {
//       const tweet = tweets.find((t) => t.id === tweetId);
//       const response = await fetch("/api/cast", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           tweetId,
//           fid: context?.user?.fid,
//           signerUuid,
//           content: tweet?.content,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to cast tweet");
//       }

//       const result = await response.json();

//       setTweets((prev) =>
//         prev.map((tweet) =>
//           tweet.id === tweetId
//             ? { ...tweet, cast_status: "cast" as const }
//             : tweet,
//         ),
//       );

//       setSuccessCastUrl(result.castUrl || "https://warpcast.com");
//       setShowSuccess(true);
//     } catch (error) {
//       console.error("Error casting tweet:", error);
//       setError("Failed to cast tweet. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditTweet = (tweet: Tweet) => {
//     setEditingTweet(tweet);
//     setShowEditModal(true);
//   };

//   const handleSaveEdit = async (editedContent: string) => {
//     if (!editingTweet) return;

//     setIsLoading(true);

//     try {
//       const response = await fetch("/api/tweets/edit", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           tweetId: editingTweet.id,
//           content: editedContent,
//           fid: context?.user?.fid,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to edit tweet");
//       }

//       setTweets((prev) =>
//         prev.map((tweet) =>
//           tweet.id === editingTweet.id
//             ? { ...tweet, content: editedContent, is_edited: true }
//             : tweet,
//         ),
//       );

//       setShowEditModal(false);
//       setEditingTweet(null);

//       setTimeout(() => handleCastRequest(editingTweet.id), 500);
//     } catch (error) {
//       console.error("Error editing tweet:", error);
//       setError("Failed to edit tweet. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleUsdcApproval = async (limit: number) => {
//     setIsLoading(true);
//     setError("");

//     try {
//       // In a real app, you'd get the wallet address from a connected wallet
//       const mockWalletAddress = "0x742d35Cc6647C93c4FC97E9e5D93eb8D36B7D5b2";

//       const response = await fetch("/api/usdc/approve", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           fid: context?.user?.fid,
//           spendingLimit: limit,
//           walletAddress: mockWalletAddress,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to approve USDC spending");
//       }

//       const result = await response.json();
//       setSpendingApproved(true);
//       setSpendingLimit(limit);
//       setAppState("ready-to-monitor");
//     } catch (error) {
//       console.error("Error approving USDC spending:", error);
//       setError(
//         error instanceof Error
//           ? error.message
//           : "Failed to approve USDC spending. Please try again.",
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Render current page
//   if (appState === "connecting") {
//     return (
//       <WelcomePage
//         onReady={() => checkTwitterVerification()}
//         error={error}
//         setError={setError}
//       />
//     );
//   }

//   if (appState === "checking-twitter") {
//     return (
//       <TwitterVerificationPage
//         onRetry={checkTwitterVerification}
//         error={error}
//       />
//     );
//   }

//   if (appState === "twitter-not-verified") {
//     return (
//       <TwitterNotVerifiedPage
//         onRetry={checkTwitterVerification}
//         error={error}
//       />
//     );
//   }

//   if (appState === "ready-to-monitor") {
//     return (
//       <ReadyToMonitorPage
//         twitterUsername={twitterUsername}
//         onStart={startMonitoring}
//         isLoading={isLoading}
//         error={error}
//         setError={setError}
//         spendingLimit={spendingLimit}
//       />
//     );
//   }

//   if (appState === "monitoring") {
//     return <MonitoringPage twitterUsername={twitterUsername} />;
//   }

//   if (appState === "tweet-dashboard") {
//     return (
//       <>
//         <TweetDashboardPage
//           tweets={tweets}
//           twitterUsername={twitterUsername}
//           yoloMode={yoloMode}
//           onYoloToggle={handleYoloToggle}
//           onCastRequest={handleCastRequest}
//           onEditTweet={handleEditTweet}
//           onSettingsClick={() => setAppState("settings")}
//           isLoading={isLoading}
//           error={error}
//           setError={setError}
//           spendingApproved={spendingApproved}
//           onUsdcApprove={handleUsdcApproval}
//         />

//         {/* Modals */}
//         {showSignerModal && (
//           <SignerModal
//             pendingAction={pendingAction}
//             onSubmit={handleSignerSubmit}
//             onClose={() => {
//               setShowSignerModal(false);
//               setPendingAction(null);
//               setPendingTweetId("");
//             }}
//             isLoading={isLoading}
//           />
//         )}

//         {showEditModal && editingTweet && (
//           <EditModal
//             tweet={editingTweet}
//             onSave={handleSaveEdit}
//             onClose={() => {
//               setShowEditModal(false);
//               setEditingTweet(null);
//             }}
//             isLoading={isLoading}
//           />
//         )}

//         {showSuccess && (
//           <SuccessModal
//             castUrl={successCastUrl}
//             onClose={() => setShowSuccess(false)}
//           />
//         )}
//       </>
//     );
//   }

//   if (appState === "settings") {
//     return (
//       <SettingsPage
//         yoloMode={yoloMode}
//         notifications={notifications}
//         twitterUsername={twitterUsername}
//         signerUuid={signerUuid}
//         onYoloToggle={handleYoloToggle}
//         onNotificationsToggle={setNotifications}
//         onBack={() => setAppState("tweet-dashboard")}
//         spendingLimit={spendingLimit}
//         spendingApproved={spendingApproved}
//       />
//     );
//   }

//   return null;
// }

"use client";

import React, { useEffect } from "react";
import WelcomeCard from "./components/welcome/WelcomeCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import UserProfiles from "./components/welcome/UserProfiles";
import { motion } from "framer-motion";

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return (
    <motion.div
      className="flex flex-col items-center justify-start h-screen overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WelcomeCard />
      <UserProfiles />
    </motion.div>
  );
}
