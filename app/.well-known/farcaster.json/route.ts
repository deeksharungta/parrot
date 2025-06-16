export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  // You can use appUrl for debugging or additional configuration
  console.log(`Server running at: ${appUrl}`);

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEzNTAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxZjVBN0VFMkExZjY2QzAzOEI3ZEU2ODg0N0ZkYmZjQzZGNkU1M2I5In0",
      payload: "eyJkb21haW4iOiJwYXJyb3QuY2xpY2sifQ",
      signature:
        "MHg2M2JmYThjMzE1YzM5MDE4MjY1NGVkZTljN2JlYjljMjExNjg1YWUxODdhMDVkYjk0OTdlZGYxMjZlNjA4MTg3MmUwMWZkYmZhMzk5NWFjOTZkMzgwYmU1MzVkODkwZTQ4MTE1OWYzNjU3NDE3M2Q2OWY2Y2ZlMGNiYzFiNDI4ZDFj",
    },
    frame: {
      version: "1",
      name: "Parrot",
      iconUrl: "https://parrot.click/icon.png",
      homeUrl: "https://parrot.click",
      imageUrl: "https://parrot.click/image.png",
      buttonTitle: "Check this out",
      splashImageUrl: "https://parrot.click/splash.png",
      splashBackgroundColor: "#4998D1",
      webhookUrl: "https://parrot.click/api/webhook",
    },
  };

  return Response.json(config);
}
