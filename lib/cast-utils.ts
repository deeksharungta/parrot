import { Database } from "./types/database";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
}

/**
 * Convert Twitter @mentions to Farcaster format
 * @param content - The tweet content
 * @param isEdit - If true, only convert mentions that existed in original content
 * @param originalContent - The original tweet content (used when isEdit is true)
 * @returns Promise<string> - The content with converted mentions
 */
export async function convertTwitterMentionsToFarcaster(
  content: string,
  isEdit: boolean = false,
  originalContent?: string,
): Promise<string> {
  if (!NEYNAR_API_KEY) {
    console.warn("Neynar API key not configured, skipping mention conversion");
    return content;
  }

  // Find all @mentions in the content
  const mentionRegex = /@(\w+)/g;
  let convertedContent = content;

  if (isEdit && originalContent) {
    // When editing, only convert mentions that existed in the original content
    const originalMentions = originalContent.match(mentionRegex) || [];

    // Process only the mentions that were in the original content
    for (const mention of originalMentions) {
      const username = mention.replace("@", "");

      try {
        // Try to find Farcaster user by Twitter username
        const farcasterUsername = await findFarcasterUserByTwitter(username);

        if (farcasterUsername) {
          // Replace Twitter mention with Farcaster mention in the current content
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}`, "g"),
            `@${farcasterUsername}`,
          );
        } else {
          // If no Farcaster user found, use the fallback format
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}`, "g"),
            `${username}.twitter`,
          );
        }
      } catch (error) {
        console.error(`Error converting mention @${username}:`, error);
        // Keep original mention if conversion fails
      }
    }
  } else {
    // Original behavior for non-edit cases
    const mentions = content.match(mentionRegex) || [];

    if (mentions.length === 0) {
      return content;
    }

    // Process each mention
    for (const mention of mentions) {
      const username = mention.replace("@", "");

      try {
        // Try to find Farcaster user by Twitter username
        const farcasterUsername = await findFarcasterUserByTwitter(username);

        if (farcasterUsername) {
          // Replace Twitter mention with Farcaster mention
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}`, "g"),
            `@${farcasterUsername}`,
          );
        } else {
          // If no Farcaster user found, use the fallback format
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}`, "g"),
            `${username}.twitter`,
          );
        }
      } catch (error) {
        console.error(`Error converting mention @${username}:`, error);
        // Keep original mention if conversion fails
      }
    }
  }

  return convertedContent;
}

/**
 * Find Farcaster user by Twitter username
 * @param twitterUsername - The Twitter username to search for
 * @returns Promise<string | null> - The Farcaster username or null if not found
 */
async function findFarcasterUserByTwitter(
  twitterUsername: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/by_x_username?x_username=${twitterUsername}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: { users: FarcasterUser[] } = await response.json();

    // Return the first user found (should be exact match by X username)
    if (data.users && data.users.length > 0) {
      return data.users[0].username;
    }

    return null;
  } catch (error) {
    console.error(
      `Error finding Farcaster user by X username ${twitterUsername}:`,
      error,
    );
    return null;
  }
}

/**
 * Parse tweet content to Farcaster cast format
 * @param tweetData - The tweet data object
 * @param isEdit - Whether this content is from EditModal (to skip mention conversion)
 * @returns Promise<{content: string, embeds: string[]}> - Parsed cast content and embeds
 */
export async function parseTweetToFarcasterCast(
  tweet: Database["public"]["Tables"]["tweets"]["Row"],
  isEdit: boolean = false,
): Promise<{
  content: string;
  embeds: string[];
}> {
  let content = tweet.content || tweet.content || "";
  const embeds: string[] = [];

  if (tweet.is_retweet) {
    embeds.push(tweet.twitter_url || "");
    return {
      content: "",
      embeds,
    };
  }
  // Convert Twitter mentions to Farcaster format
  content = await convertTwitterMentionsToFarcaster(
    content,
    isEdit,
    tweet.original_content || undefined,
  );

  // Remove Twitter shortened URLs (t.co links)
  content = content.replace(/https:\/\/t\.co\/\S+/g, "").trim();

  // Handle quoted tweets
  if (tweet.quoted_tweet_url) {
    embeds.push(tweet.quoted_tweet_url);
  }

  // Handle media URLs
  if (tweet.media_urls) {
    // Handle new structure with images and videos
    if (
      typeof tweet.media_urls === "object" &&
      !Array.isArray(tweet.media_urls)
    ) {
      // Handle images - limit to first 2
      if (tweet.media_urls.images && Array.isArray(tweet.media_urls.images)) {
        tweet.media_urls.images.slice(0, 2).forEach((url: string) => {
          if (url && url.trim()) {
            embeds.push(url);
          }
        });
      }

      // Handle videos - limit to first 2 (if no images or remaining slots)
      if (tweet.media_urls.videos && Array.isArray(tweet.media_urls.videos)) {
        const remainingSlots = 2 - embeds.length;
        tweet.media_urls.videos
          .slice(0, remainingSlots)
          .forEach((video: any) => {
            if (video && video.url && video.url.trim()) {
              embeds.push(video.url);
            }
          });
      }
    } else {
      // Handle legacy format (for backward compatibility)
      const mediaUrls = Array.isArray(tweet.media_urls)
        ? tweet.media_urls
        : typeof tweet.media_urls === "string"
          ? [tweet.media_urls]
          : Object.values(tweet.media_urls);

      // Add media URLs - limit to first 2
      mediaUrls.slice(0, 2).forEach((url: any) => {
        if (typeof url === "string" && url.trim()) {
          embeds.push(url);
        }
      });
    }
  }

  return {
    content,
    embeds,
  };
}
