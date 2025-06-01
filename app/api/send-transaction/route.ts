import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, erc20Abi, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(request: NextRequest) {
  try {
    const { to, amount } = await request.json();

    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

    if (!privateKey) {
      throw new Error("Private key not configured");
    }

    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    const hash = await walletClient.writeContract({
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      abi: erc20Abi,
      functionName: "transferFrom",
      args: ["0x6d4fd0f39f03075edc0637a147b2a4734a4e82af", to, BigInt(1000)],
    });

    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
