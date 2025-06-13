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
      name: "Parrot",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/image.png`,
      buttonTitle: "Check this out",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#eeccff",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
