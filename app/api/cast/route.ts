import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function POST(request: NextRequest) {
  const { signerUuid, text } = (await request.json()) as {
    signerUuid: string;
    text: string;
  };

  try {
    const response = await client.publishCast(signerUuid, text);
    const { hash } = response;
    return NextResponse.json(
      { message: `Cast with hash ${hash} published successfully` },
      { status: 200 },
    );
  } catch (err) {
    if (isApiErrorResponse(err)) {
      return NextResponse.json(
        { ...err.response.data },
        { status: err.response.status },
      );
    } else
      return NextResponse.json(
        { message: "Something went wrong" },
        { status: 500 },
      );
  }
}
