import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,solana&vs_currencies=usd&x_cg_demo_api_key=CG-B9XPAiMcNFCV65Y3b3d2uYkF"
    ); // Added API key as per CoinGecko new policy
    if (!response.ok) {
      const errorData = await response.text();
      console.error("CoinGecko API Error:", errorData);
      throw new Error(
        `Failed to fetch crypto prices: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/prices:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
