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
 * @returns Promise<string> - The content with converted mentions
 */
export async function convertTwitterMentionsToFarcaster(
  content: string,
): Promise<string> {
  if (!NEYNAR_API_KEY) {
    console.warn("Neynar API key not configured, skipping mention conversion");
    return content;
  }

  // Find all @mentions in the content
  const mentionRegex = /@(\w+)/g;
  const mentions = content.match(mentionRegex);

  if (!mentions || mentions.length === 0) {
    return content;
  }

  let convertedContent = content;

  // Process each mention
  for (const mention of mentions) {
    const twitterUsername = mention.replace("@", "");

    try {
      // Search for Farcaster user by Twitter username
      const farcasterUsername =
        await findFarcasterUserByTwitter(twitterUsername);

      if (farcasterUsername) {
        // Replace Twitter mention with Farcaster mention
        convertedContent = convertedContent.replace(
          new RegExp(`@${twitterUsername}`, "g"),
          `@${farcasterUsername}`,
        );
      } else {
        // If no Farcaster user found, use the fallback format
        convertedContent = convertedContent.replace(
          new RegExp(`@${twitterUsername}`, "g"),
          `${twitterUsername}.twitter`,
        );
      }
    } catch (error) {
      console.error(`Error converting mention @${twitterUsername}:`, error);
      // Keep original mention if conversion fails
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
 * @returns Promise<{content: string, embeds: string[]}> - Parsed cast content and embeds
 */
export async function parseTweetToFarcasterCast(tweetData: any): Promise<{
  content: string;
  embeds: string[];
}> {
  let content = tweetData.content || tweetData.text || "";
  const embeds: string[] = [];

  // Convert Twitter mentions to Farcaster format
  content = await convertTwitterMentionsToFarcaster(content);

  // Handle quoted tweets
  if (tweetData.quoted_tweet_url) {
    // Add quoted tweet URL as embed
    embeds.push(tweetData.quoted_tweet_url);
  }

  // Handle media URLs
  if (tweetData.media_urls) {
    const mediaUrls = Array.isArray(tweetData.media_urls)
      ? tweetData.media_urls
      : typeof tweetData.media_urls === "string"
        ? [tweetData.media_urls]
        : Object.values(tweetData.media_urls);

    // Add media URLs as embeds
    mediaUrls.forEach((url: any) => {
      if (typeof url === "string" && url.trim()) {
        embeds.push(url);
      }
    });
  }

  // Clean up content - remove t.co links that are replaced by embeds
  content = content.replace(/https:\/\/t\.co\/\S+/g, "").trim();

  // Remove extra whitespace
  content = content.replace(/\s+/g, " ").trim();

  return {
    content,
    embeds,
  };
}
