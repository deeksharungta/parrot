import { Database } from "./types/database";
import { decodeHtmlEntities } from "./utils/sanitization";

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
 * Check if a user has pro subscription status
 * @param fid - The user's Farcaster ID
 * @returns Promise<boolean> - true if user has pro subscription
 */
export async function checkUserProStatus(fid: number): Promise<boolean> {
  try {
    if (!NEYNAR_API_KEY) {
      console.error("Neynar API key not configured");
      return false;
    }

    // Fetch user data to check pro status
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status);
      return false;
    }

    const data = await response.json();

    // Check if user has pro subscription
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return user.pro && user.pro.status === "subscribed";
    }

    return false;
  } catch (error) {
    console.error("Error checking pro status:", error);
    return false;
  }
}

/**
 * Get embed limit based on user's pro status
 * @param fid - The user's Farcaster ID
 * @returns Promise<number> - embed limit (2 for regular users, 4 for pro users)
 */
export async function getEmbedLimit(fid: number): Promise<number> {
  const isProUser = await checkUserProStatus(fid);
  return isProUser ? 4 : 2;
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
  // Find all @mentions in the content
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  let convertedContent = content;

  if (isEdit && originalContent) {
    // When editing, only convert mentions that existed in the original content
    const originalMentions = originalContent.match(mentionRegex) || [];

    // Process only the mentions that were in the original content
    for (const mention of originalMentions) {
      const username = mention.replace("@", "");

      if (!NEYNAR_API_KEY) {
        // If no API key, use fallback format
        convertedContent = convertedContent.replace(
          new RegExp(`@${username}\\b`, "g"),
          `${username}.twitter`,
        );
        continue;
      }

      try {
        // Try to find Farcaster user by Twitter username
        const farcasterUsername = await findFarcasterUserByTwitter(username);

        if (farcasterUsername) {
          // Replace Twitter mention with Farcaster mention in the current content
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}\\b`, "g"),
            `@${farcasterUsername}`,
          );
        } else {
          // If no Farcaster user found, use the fallback format
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}\\b`, "g"),
            `${username}.twitter`,
          );
        }
      } catch (error) {
        console.error(`Error converting mention @${username}:`, error);
        // Use fallback format if conversion fails
        convertedContent = convertedContent.replace(
          new RegExp(`@${username}\\b`, "g"),
          `${username}.twitter`,
        );
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

      if (!NEYNAR_API_KEY) {
        // If no API key, use fallback format
        convertedContent = convertedContent.replace(
          new RegExp(`@${username}\\b`, "g"),
          `${username}.twitter`,
        );
        continue;
      }

      try {
        // Try to find Farcaster user by Twitter username
        const farcasterUsername = await findFarcasterUserByTwitter(username);

        if (farcasterUsername) {
          // Replace Twitter mention with Farcaster mention
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}\\b`, "g"),
            `@${farcasterUsername}`,
          );
        } else {
          // If no Farcaster user found, use the fallback format
          convertedContent = convertedContent.replace(
            new RegExp(`@${username}\\b`, "g"),
            `${username}.twitter`,
          );
        }
      } catch (error) {
        console.error(`Error converting mention @${username}:`, error);
        // Use fallback format if conversion fails
        convertedContent = convertedContent.replace(
          new RegExp(`@${username}\\b`, "g"),
          `${username}.twitter`,
        );
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
 * Check if a tweet has media attached
 */
function hasMedia(
  tweet: Database["public"]["Tables"]["tweets"]["Row"],
): boolean {
  if (!tweet.media_urls) {
    return false;
  }

  if (Array.isArray(tweet.media_urls)) {
    return tweet.media_urls.length > 0;
  }

  if (typeof tweet.media_urls === "object") {
    const urlKeys = ["images", "videos", "gifs", "photos"];
    return Object.entries(tweet.media_urls).some(([key, urls]) => {
      if (urlKeys.includes(key) && Array.isArray(urls)) {
        return urls.length > 0;
      }
      return false;
    });
  }

  if (typeof tweet.media_urls === "string") {
    return (tweet.media_urls as string).trim().length > 0;
  }

  return false;
}

/**
 * Remove t.co links from content based on media presence
 * Only removes the last t.co link if there's media attached
 */
function removeTwitterLinks(
  content: string,
  hasMediaAttached: boolean,
): string {
  if (!hasMediaAttached) {
    // If no media, keep all t.co links as they might be actual links
    return content;
  }

  // If there's media, only remove the last t.co link
  const tcoRegex = /https:\/\/t\.co\/\S+/g;
  const matches = Array.from(content.matchAll(tcoRegex));

  if (matches.length === 0) {
    return content;
  }

  // Only remove the last match
  const lastMatch = matches[matches.length - 1];
  if (lastMatch.index === undefined) {
    return content;
  }

  const beforeLastLink = content.substring(0, lastMatch.index);
  const afterLastLink = content.substring(
    lastMatch.index + lastMatch[0].length,
  );

  // Clean up any double spaces that might result from URL removal
  return (beforeLastLink + afterLastLink).trim();
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

  // Check if tweet has video or GIF content - if so, embed entire tweet like retweets
  if (
    !tweet.is_retweet &&
    !tweet.quoted_tweet_url &&
    tweet.media_urls &&
    typeof tweet.media_urls === "object"
  ) {
    const hasVideo =
      tweet.media_urls.videos &&
      Array.isArray(tweet.media_urls.videos) &&
      tweet.media_urls.videos.length > 0;
    const hasGif =
      tweet.media_urls.types &&
      Array.isArray(tweet.media_urls.types) &&
      tweet.media_urls.types.includes("animated_gif");

    if (hasVideo || hasGif) {
      embeds.push(tweet.twitter_url || "");
      return {
        content: "",
        embeds,
      };
    }
  }

  // Clean up HTML entities and formatting FIRST
  content = decodeHtmlEntities(content);

  // Convert Twitter mentions to Farcaster format
  content = await convertTwitterMentionsToFarcaster(
    content,
    isEdit,
    tweet.original_content || undefined,
  );

  // Remove Twitter shortened URLs (t.co links) only if there's media
  const tweetHasMedia = hasMedia(tweet);
  content = removeTwitterLinks(content, tweetHasMedia);

  // // Resolve t.co URLs to their actual destinations
  content = await resolveTcoUrls(content);

  // Handle quoted tweets
  if (tweet.quoted_tweet_url) {
    embeds.push(tweet.quoted_tweet_url);
  }

  // Handle media URLs - Updated for new simplified format
  if (tweet.media_urls) {
    let mediaUrls: string[] = [];

    if (Array.isArray(tweet.media_urls)) {
      // New simplified format: Array<{ type: string; url: string }>
      tweet.media_urls.forEach((media: any) => {
        if (media && typeof media === "object" && media.url) {
          mediaUrls.push(media.url);
        } else if (typeof media === "string") {
          // Backward compatibility for simple string arrays
          mediaUrls.push(media);
        }
      });
    } else if (typeof tweet.media_urls === "object") {
      // Legacy format support: { images: [], videos: [], gifs: [], photos: [] }
      const urlKeys = ["images", "videos", "gifs", "photos"];

      Object.entries(tweet.media_urls).forEach(([key, urls]) => {
        // Skip metadata arrays like "types" - only process actual URL arrays
        if (urlKeys.includes(key) && Array.isArray(urls)) {
          urls.forEach((url: any) => {
            if (
              typeof url === "string" &&
              url.trim() &&
              (url.startsWith("http://") || url.startsWith("https://"))
            ) {
              mediaUrls.push(url);
            }
          });
        } else if (typeof urls === "string" && urls.startsWith("http")) {
          mediaUrls.push(urls);
        }
      });
    } else if (typeof tweet.media_urls === "string") {
      // Single URL as string
      mediaUrls.push(tweet.media_urls);
    }

    // Farcaster has a strict 2-embed limit per cast
    const maxEmbeds = Math.min(mediaUrls.length, 2 - embeds.length);
    mediaUrls.slice(0, maxEmbeds).forEach((url: string) => {
      if (url && url.trim()) {
        embeds.push(url);
      }
    });
  }

  return {
    content,
    embeds,
  };
}

/**
 * Resolve all t.co URLs in text content to their actual destinations
 * @param content - Text content containing t.co URLs
 * @returns Promise<string> - Content with t.co URLs resolved to actual URLs
 */
export async function resolveTcoUrls(content: string): Promise<string> {
  if (!content) return content;

  const tcoRegex = /https:\/\/t\.co\/\S+/g;
  const matches = Array.from(content.matchAll(tcoRegex));

  if (matches.length === 0) {
    return content;
  }

  let updatedContent = content;

  // Resolve all t.co URLs found in the content
  for (const match of matches) {
    const tcoUrl = match[0];

    try {
      const response = await fetch(tcoUrl, {
        method: "HEAD", // Use HEAD to avoid downloading the full response
        redirect: "follow", // Follow redirects
      });

      // Replace the t.co URL with the resolved URL
      const resolvedUrl = response.url;
      updatedContent = updatedContent.replace(tcoUrl, resolvedUrl);

      console.log(`Resolved t.co URL: ${tcoUrl} -> ${resolvedUrl}`);
    } catch (error) {
      console.error(`Failed to resolve t.co URL ${tcoUrl}:`, error);
      // Keep the original t.co URL if resolution fails
    }
  }

  return updatedContent;
}

export async function resolveTcoUrlsServerSide(
  content: string,
): Promise<string> {
  if (!content) return content;

  const tcoRegex = /https:\/\/t\.co\/\S+/g;
  const matches = Array.from(content.matchAll(tcoRegex));

  if (matches.length === 0) {
    return content;
  }

  let updatedContent = content;

  // Resolve all t.co URLs found in the content using server-side API
  for (const match of matches) {
    const tcoUrl = match[0];

    try {
      const response = await fetch("/api/resolve-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: tcoUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        const resolvedUrl = data.resolvedUrl;

        // Only replace if we got a different URL
        if (resolvedUrl && resolvedUrl !== tcoUrl) {
          updatedContent = updatedContent.replace(tcoUrl, resolvedUrl);
          console.log(`Resolved t.co URL: ${tcoUrl} -> ${resolvedUrl}`);
        } else {
          console.log(
            `Could not resolve t.co URL: ${tcoUrl}, keeping original`,
          );
        }
      } else {
        console.error(`Failed to resolve t.co URL ${tcoUrl}: API error`);
      }
    } catch (error) {
      console.error(`Failed to resolve t.co URL ${tcoUrl}:`, error);
      // Keep the original t.co URL if resolution fails
    }
  }

  return updatedContent;
}

export async function convertTwitterMentionsToFarcasterServerSide(
  content: string,
  useCache: boolean = true,
  originalContent?: string,
): Promise<string> {
  if (!content) return content;

  try {
    const response = await fetch("/api/convert-mentions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        useCache,
        originalContent,
      }),
    });

    if (!response.ok) {
      console.error(
        `Mention conversion API response not ok:`,
        response.status,
        response.statusText,
      );
      return content; // Return original content if API fails
    }

    const data = await response.json();
    console.log(`Mention conversion result:`, data);

    // Check if conversion was successful
    if (data.success && data.convertedContent) {
      console.log(
        `Successfully converted mentions: ${content} -> ${data.convertedContent}`,
      );
      return data.convertedContent;
    } else {
      console.log(
        `Could not convert mentions: ${data.error || "No conversion found"}`,
      );
      return content; // Return original content if conversion failed
    }
  } catch (error) {
    console.error(`Error converting Twitter mentions:`, error);
    return content; // Return original content if there was an error
  }
}
