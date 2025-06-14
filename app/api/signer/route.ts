import neynarClient from "@/lib/neynarClient";
import { getSignedKey } from "@/lib/utils/getSignedKey";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";

export const OPTIONS = createOptionsHandler();

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const signedKey = await getSignedKey(true);

    return NextResponse.json(signedKey, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
});

export const GET = withApiKeyAndJwtAuth(async function (
  req: NextRequest,
  authenticatedFid: number,
) {
  const { searchParams } = new URL(req.url);
  const signer_uuid = searchParams.get("signer_uuid");

  if (!signer_uuid) {
    return NextResponse.json(
      { error: "signer_uuid is required" },
      { status: 400 },
    );
  }

  try {
    const signer = await neynarClient.lookupSigner(signer_uuid);

    return NextResponse.json(signer, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
});
