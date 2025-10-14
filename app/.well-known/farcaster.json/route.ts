export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "",
      payload: process.env.FARCASTER_PAYLOAD || "",
      signature: process.env.FARCASTER_SIGNATURE || "",
    },
    baseBuilder: {
      allowedAddresses: [process.env.BASE_ACCOUNT_ADDRESS || ""],
    },
    miniapp: {
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Parrot",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#4998D1",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "Make your post work for you",
      description: "Make your post work for you",
      screenshotUrls: [`${appUrl}/screenshot.png`, `${appUrl}/hero.png`],
      primaryCategory: "social",
      tags: ["social", "miniapp", "baseapp", "farcaster"],
      heroImageUrl: `${appUrl}/hero.png`,
      tagline: "Make your post work for you",
      ogTitle: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Parrot",
      ogDescription: "Make your post work for you",
      ogImageUrl: `${appUrl}/hero.png`,
      noindex: false,
    },
  };

  return Response.json(manifest);
}
