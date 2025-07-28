export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  // You can use appUrl for debugging or additional configuration
  console.log(`Server running at: ${appUrl}`);

  const config = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: `${appUrl}`,
      imageUrl: `${appUrl}/image.png`,
      buttonTitle: "Check this out",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#4998D1",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "Make your post work for you",
      description: "Make your post work for you",
      screenshotUrls: [`${appUrl}/screenshot.png`],
      primaryCategory: "social",
      tags: ["social", "twitter", "cast"],
      heroImageUrl: `${appUrl}/hero.png`,
      tagline: "Make your post work for you",
      ogTitle: "Parrot",
      ogDescription: "Make your post work for you",
      ogImageUrl: `${appUrl}/hero.png`,
    },
  };

  return Response.json(config);
}
