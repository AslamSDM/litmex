import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana, bsc } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "70a53b1a23f2f0f2815353fd11fd49d1"; // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [solana, bsc] as [AppKitNetwork, ...AppKitNetwork[]];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),

  ssr: true,
  projectId,
  networks,
});

export const solanaWeb3JsAdapter = new SolanaAdapter();

export const config = wagmiAdapter.wagmiConfig;
