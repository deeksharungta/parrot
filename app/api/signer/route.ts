import neynarClient from "@/lib/neynarClient";
import { getSignedKey } from "@/lib/utils/getSignedKey";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";

export const OPTIONS = createOptionsHandler();

export const POST = withAuth(async function () {
  try {
    const signedKey = await getSignedKey(true);

    return NextResponse.json(signedKey, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
});

export const GET = withAuth(async function (req: NextRequest) {
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
