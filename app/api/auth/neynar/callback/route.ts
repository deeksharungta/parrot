import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      // Return an HTML page that posts error message to parent window
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Error</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'NEYNAR_AUTH_ERROR',
                error: '${error}'
              }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
            <p>Authorization failed. This window should close automatically.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    if (!code || !state) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Error</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'NEYNAR_AUTH_ERROR',
                error: 'Missing authorization code or state'
              }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
            <p>Authorization failed. This window should close automatically.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    // Exchange authorization code for access token
    const neynarClientId =
      process.env.NEYNAR_CLIENT_ID || "your-neynar-client-id";
    const neynarClientSecret =
      process.env.NEYNAR_CLIENT_SECRET || "your-neynar-client-secret";

    const tokenResponse = await fetch("https://app.neynar.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: neynarClientId,
        client_secret: neynarClientSecret,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/neynar/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Error</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'NEYNAR_AUTH_ERROR',
                error: 'Failed to exchange authorization code'
              }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
            <p>Authorization failed. This window should close automatically.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, signer_uuid } = tokenData;

    if (!signer_uuid) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Error</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'NEYNAR_AUTH_ERROR',
                error: 'No signer UUID received from Neynar'
              }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
            <p>Authorization failed. This window should close automatically.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    // Success - return HTML that posts success message to parent window
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Success</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'NEYNAR_AUTH_SUCCESS',
              signerUuid: '${signer_uuid}',
              accessToken: '${access_token}'
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
          <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px;">
            <h2>✅ Authorization Successful!</h2>
            <p>You can now close this window and return to TweetCaster.</p>
            <p style="color: #666; font-size: 14px;">This window should close automatically...</p>
          </div>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  } catch (error) {
    console.error("Error in Neynar callback:", error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Error</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'NEYNAR_AUTH_ERROR',
              error: 'Internal server error'
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
          <p>Authorization failed. This window should close automatically.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}
