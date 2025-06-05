import type { Tweet } from "react-tweet/api";
import {
  type TwitterComponents,
  TweetContainer,
  TweetHeader,
  TweetInReplyTo,
  TweetBody,
  TweetMedia,
  TweetInfo,
  QuotedTweet,
  enrichTweet,
} from "react-tweet";
import Image from "next/image";
import BlueTick from "../icons/BlueTick";

type Props = {
  tweet: Tweet;
  components?: TwitterComponents;
};

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else {
    // For tweets older than 30 days, show the date
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export default function MyTweet({ tweet: t, components }: Props) {
  const tweet = enrichTweet(t);
  return (
    <div className="bg-white rounded-3xl border border-[#ECECED] h-full relative z-10 overflow-y-auto">
      <div className="h-full overflow-y-auto">
        <TweetContainer className="mx-auto border-none p-3">
          <div className="flex items-start gap-2 mb-3">
            <Image
              src={tweet.user.profile_image_url_https}
              alt={tweet.user.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="text-[#100C20] text-base font-semibold flex items-center gap-1">
                {tweet.user.name}{" "}
                {tweet.user.is_blue_verified ? <BlueTick /> : null}
              </p>
              <p className="text-[#8C8A94] text-sm flex items-center gap-1">
                @{tweet.user.screen_name} ·{" "}
                <span className="text-[#8C8A94] text-sm">
                  {getRelativeTime(tweet.created_at)}
                </span>
              </p>
            </div>
          </div>
          {tweet.in_reply_to_status_id_str && <TweetInReplyTo tweet={tweet} />}
          <TweetBody tweet={tweet} />
          {tweet.mediaDetails?.length ? (
            <TweetMedia tweet={tweet} components={components} />
          ) : null}
          {tweet.quoted_tweet && <QuotedTweet tweet={tweet.quoted_tweet} />}
        </TweetContainer>
      </div>

      <style jsx global>{`
        /* React tweet theme variables for font sizing */
        .react-tweet-theme {
          --tweet-border: 1px solid #ececed;
          --tweet-container-margin: 0;
          --tweet-header-font-size: 0.9375rem;
          --tweet-header-line-height: 1.25rem;
          --tweet-body-font-size: 14px;
          --tweet-body-font-color: #494656;
          --tweet-body-font-weight: 400;
          --tweet-body-line-height: 1.1rem;
          --tweet-body-margin: 0;
          --tweet-quoted-container-margin: 0.75rem 0;
          --tweet-quoted-body-font-size: 0.938rem;
          --tweet-quoted-body-font-weight: 400;
          --tweet-quoted-body-line-height: 1.25rem;
          --tweet-quoted-body-margin: 0.25rem 0 0.75rem 0;
          --tweet-info-font-size: 14px;
          --tweet-info-line-height: 1.25rem;
          --tweet-info-font-color: #8c8a94;
          --tweet-actions-font-size: 0.875rem;
          --tweet-actions-line-height: 1rem;
          --tweet-actions-font-weight: 700;
          --tweet-actions-icon-size: 1.25em;
          --tweet-actions-icon-wrapper-size: calc(
            var(--tweet-actions-icon-size) + 0.75em
          );
          --tweet-replies-font-size: 0.875rem;
          --tweet-replies-line-height: 1rem;
          --tweet-replies-font-weight: 700;
          --tweet-font-color: #494656;
          --tweet-font-color-secondary: #8c8a94;
          --tweet-font-family: var(--font-outfit);
          --tweet-bg-color-hover: white;
          --tweet-quoted-bg-color-hover: white;
        }

        /* Override tweet container border radius */
        .tweet-container_root__0rJLq {
          border-radius: 0px !important;
          border: none !important;
        }

        /* Override tweet component styles for dark theme */
        .bg-gray-900 .tweet-header {
          color: white !important;
          font-family: var(--font-outfit) !important;
        }
        .bg-gray-900 .tweet-body {
          color: #8c8a94 !important;
          font-family: var(--font-outfit) !important;
          font-size: 14px !important;
        }
        .bg-gray-900 .tweet-info {
          color: #8c8a94 !important;
          font-family: var(--font-outfit) !important;
        }
        .bg-gray-900 a {
          color: #494656 !important;
          font-family: var(--font-outfit) !important;
        }
        .bg-gray-900 [data-theme] {
          background: transparent !important;
          color: white !important;
          font-family: var(--font-outfit) !important;
        }
        .bg-gray-900 [data-theme] * {
          color: inherit !important;
          font-family: inherit !important;
        }
        /* Ensure all text elements use Outfit font */
        .bg-gray-900 * {
          font-family: var(--font-outfit) !important;
        }
      `}</style>
    </div>
  );
}
