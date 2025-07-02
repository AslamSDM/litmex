import { useState, useEffect, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  type SendOptions,
} from "@solana/web3.js";
import { useAppKitState, useAppKitAccount } from "@reown/appkit/react";
import { modal } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  fetchCryptoPrices,
  calculateCryptoCost,
  calculateTokenAmount,
  LMX_PRICE_USD,
} from "@/lib/price-utils";
import { solanaPresale } from "@/lib/presale-contract";
import { useBscPresale } from "./useBscPresale";
import { useReadContract } from "wagmi";
import { presaleAbi } from "@/lib/abi";
import { BSC_PRESALE_CONTRACT_ADDRESS } from "@/lib/constants";

// Define an explicit shape for appKitState to resolve type BSCdiscrepancies
export interface AppKitStateShape {
  // Fields TS currently infers for appKitState in usePresale.ts
  initialized: boolean;
  loading: boolean;
  open: boolean;
  selectedNetworkId?:
    | `solana:${string}`
    | `solana:${number}`
    | `eip155:${string}`
    | `eip155:${number}`
    | `polkadot:${string}`
    | `polkadot:${number}`
    | `bip122:${string}`
    | `bip122:${number}`
    | `cosmos:${string}`
    | `cosmos:${number}`
    | undefined;
  activeChain?: any; // Keep 'any' for now if its internal structure isn't the primary issue

  // Fields successfully used in WalletConnectButton.tsx and needed here
  account?: { address?: string }; // This will be less relied upon directly in usePresale
  connected?: boolean; // This will be less relied upon directly in usePresale
  connector?: { id: string; name?: string; provider?: any };
  chainId?: string | number; // This will be less relied upon directly in usePresale
}

interface PresaleStatus {
  isActive: boolean;
  hardCap: string;
  minPurchase: string;
  maxPurchase: string;
  tokenPrice: string;
  soldTokens: string;
  totalRaised: string;
  percentageSold: number;
}

type WalletType = "bsc" | "solana" | null;

// Updated to use appkitAccountData and appKitState
export function getWalletType(
  appKitState: AppKitStateShape,
  appkitAccountData: {
    isConnected?: boolean;
    caipAddress?: string;
  }
): WalletType {
  const { initialized, loading, connector, selectedNetworkId, activeChain } =
    appKitState;
  const { isConnected: accIsConnected, caipAddress: accCaipAddress } =
    appkitAccountData;

  if (!initialized || loading) {
    return null;
  }

  if (!accIsConnected || !connector || typeof connector.id !== "string") {
    return null;
  }

  let caipNamespace: string | undefined;
  let caipChainIdPart: string | undefined;

  if (accCaipAddress) {
    const parts = accCaipAddress.split(":");
    if (parts.length >= 2) {
      caipNamespace = parts[0];
      caipChainIdPart = parts[1];
    }
  }

  // Check for Solana
  console.log("CAIP Namespace:", caipNamespace);
  if (caipNamespace === "solana") {
    return "solana";
  }
  if (
    connector.id.includes("solana") ||
    (selectedNetworkId && selectedNetworkId.startsWith("solana:")) ||
    (activeChain &&
      typeof activeChain === "string" &&
      activeChain.startsWith("solana"))
  ) {
    return "solana";
  }

  // Check for BSC (EVM)
  let numericChainId: number | undefined = undefined;

  if (
    caipNamespace === "eip155" &&
    caipChainIdPart &&
    !isNaN(parseInt(caipChainIdPart))
  ) {
    numericChainId = parseInt(caipChainIdPart, 10);
  } else {
    const stateChainId = appKitState.chainId;
    if (typeof stateChainId === "number") {
      numericChainId = stateChainId;
    } else if (typeof stateChainId === "string") {
      const parts = stateChainId.split(":");
      const chainIdStr = parts.length > 1 ? parts[1] : parts[0];
      if (chainIdStr && !isNaN(parseInt(chainIdStr))) {
        numericChainId = parseInt(chainIdStr, 10);
      }
    } else if (selectedNetworkId && selectedNetworkId.startsWith("eip155:")) {
      const chainIdStr = selectedNetworkId.substring(7);
      if (chainIdStr && !isNaN(parseInt(chainIdStr))) {
        numericChainId = parseInt(chainIdStr, 10);
      }
    }
  }

  if (numericChainId !== undefined) {
    if (numericChainId === 56 || numericChainId === 97) {
      // BSC Mainnet or Testnet
      return "bsc";
    }
  }

  const isOnEIP155Chain =
    activeChain === "eip155" ||
    (selectedNetworkId && selectedNetworkId.startsWith("eip155:"));
  if (isOnEIP155Chain) {
    if (
      connector.id.includes("metaMask") ||
      connector.id.includes("walletConnect")
    ) {
      return "bsc";
    }
    if (connector.name) {
      const lowerName = connector.name.toLowerCase();
      if (
        lowerName.includes("metamask") ||
        lowerName.includes("walletconnect")
      ) {
        return "bsc";
      }
    }
  }

  return null; // Default if no specific type could be determined
}

export default function usePresale() {
  // Cast to the explicit shape
  const appKitState = useAppKitState() as AppKitStateShape;
  const appkitAccounts = useAppKitAccount();
  // Access properties directly, now guided by AppKitStateShape and appkitAccounts
  const walletAddress = appkitAccounts?.address;
  const isConnected = appkitAccounts?.isConnected ?? false;

  const currentWalletType = getWalletType(appKitState, {
    isConnected: appkitAccounts?.isConnected,
    caipAddress: appkitAccounts?.caipAddress,
  });
  const { data: userBalance, error } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "balanceOf",
    args: [walletAddress],
  });
  //   const { data: presaleStatus } = useReadContract({
  //     address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
  //     abi: presaleAbi.abi,
  //     functionName: "presaleActive",
  //     args: [],
  //   });
  const { data: min } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "minPurchase",
    args: [],
  });
  const { data: max } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "maxPurchase",
    args: [],
  });
  const { data: soldTokens } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "soldTokens",
    args: [],
  });
  const { data: totalRaised } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "totalRaised",
    args: [],
  });
  const { data: hardcap } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "hardCap",
    args: [],
  });
  const percentageSold =
    totalRaised && hardcap ? (Number(totalRaised) / Number(hardcap)) * 100 : 0;

  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  // Initialize presaleNetwork to 'bsc' and allow switching
  const [presaleNetwork, setPresaleNetwork] = useState<"bsc" | "solana">("bsc");
  const [tokenAmount, setTokenAmount] = useState<number>(100);
  const [bscStatus, setBscStatus] = useState<PresaleStatus | null>(null);
  const [solanaStatus, setSolanaStatus] = useState<PresaleStatus | null>(null);
  const [userPurchasedTokens, setUserPurchasedTokens] = useState("0");
  const { presaleStatus } = useBscPresale(tokenAmount);
  const [cryptoPrices, setCryptoPrices] = useState<{
    bnb: number;
    sol: number;
  } | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<{
    bnb: number;
    sol: number;
  }>({ bnb: 0, sol: 0 });

  const hasConnectedWallet = isConnected;
  const hasBscWalletConnected = isConnected && currentWalletType === "bsc";
  const hasSolanaWalletConnected =
    isConnected && currentWalletType === "solana";

  // Removed useEffect that forced presaleNetwork to 'bsc'

  const loadCryptoPrices = useCallback(
    async (
      forceRefresh: boolean = false,
      pricesServer: {
        bnb: number;
        sol: number;
      } | null = null
    ) => {
      setIsLoadingPrices(true);
      try {
        const prices = pricesServer || (await fetchCryptoPrices(forceRefresh));
        setCryptoPrices(prices);
        if (tokenAmount > 0) {
          const bnbCost = calculateCryptoCost(tokenAmount, "bnb", prices);
          const solCost = calculateCryptoCost(tokenAmount, "sol", prices);
          setEstimatedCost({ bnb: bnbCost, sol: solCost });
        }
        if (forceRefresh) {
          toast.success("Cryptocurrency prices updated successfully");
        }
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
        if (forceRefresh) {
          toast.error("Failed to fetch new cryptocurrency prices");
        } else {
          toast.error("Failed to fetch cryptocurrency prices");
        }
      } finally {
        setIsLoadingPrices(false);
      }
    },
    [tokenAmount]
  );

  useEffect(() => {
    loadCryptoPrices(false);
    const intervalId = setInterval(
      () => {
        loadCryptoPrices(true);
      },
      5 * 60 * 1000
    );
    return () => clearInterval(intervalId);
  }, [loadCryptoPrices]);

  useEffect(() => {
    if (cryptoPrices && tokenAmount > 0) {
      const bnbCost = calculateCryptoCost(tokenAmount, "bnb", cryptoPrices);
      const solCost = calculateCryptoCost(tokenAmount, "sol", cryptoPrices);
      setEstimatedCost({ bnb: bnbCost, sol: solCost });
    }
  }, [tokenAmount, cryptoPrices]);

  const calculateTokensFromCrypto = useCallback(
    (cryptoAmount: number, cryptoType: "bnb" | "sol") => {
      if (!cryptoPrices || cryptoAmount <= 0) return 0;
      return calculateTokenAmount(cryptoAmount, cryptoType, cryptoPrices);
    },
    [cryptoPrices]
  );

  const loadSolanaPresaleStatus = useCallback(async () => {
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com"
      );
      const status = await solanaPresale.getPresaleStatus(connection);
      if (status) {
        setSolanaStatus(status);
      }
    } catch (error) {
      console.error("Error loading Solana presale status:", error);
      toast.error("Failed to load Solana presale data");
    }
  }, []);

  const buyTokens = async (amount: number, referrer?: string) => {
    if (isBuying) return;
    setIsBuying(true);
    try {
      if (presaleNetwork === "bsc") {
        // if (!hasBscWalletConnected) {
        //   toast.error(
        //     "BSC wallet not connected. Please connect your BSC wallet to buy."
        //   );
        //   modal.open();
        //   setIsBuying(false);
        //   return;
        // }
        // const success = await bscPresale.buyTokens(amount, referrer);
        // if (success) {
        //   await loadBscPresaleStatus();
        //   await loadUserPurchasedTokens(); // This is BSC specific
        // }
      } else if (presaleNetwork === "solana") {
        if (!hasSolanaWalletConnected) {
          toast.error(
            "Solana wallet not connected. Please connect your Solana wallet to buy."
          );
          modal.open();
          setIsBuying(false);
          return;
        }
        // TODO: Implement actual Solana buy logic using solanaPresale.buyTokens
        toast.info(
          `Solana buy for ${amount} LMX (referrer: ${
            referrer || "none"
          }) is not yet implemented in the hook.`
        );
        // Example:
        // const success = await solanaPresale.buyTokens(amount, referrer, walletAddress, currentConnector?.provider);
        // if (success) {
        //   await loadSolanaPresaleStatus();
        //   // await loadUserSolanaPurchasedTokens();
        // }
      } else {
        toast.error("No presale network selected.");
        setIsBuying(false);
        return;
      }
    } catch (error: any) {
      console.error(`Error buying tokens on ${presaleNetwork}:`, error);
      toast.error(
        error.message || `Failed to purchase tokens on ${presaleNetwork}`
      );
    } finally {
      setIsBuying(false);
    }
  };

  const switchNetwork = (newNetwork: "bsc" | "solana") => {
    setPresaleNetwork(newNetwork);
    if (newNetwork === "bsc" && !hasBscWalletConnected) {
      toast.info(
        "BSC wallet not connected. Please connect to interact with the BSC presale."
      );
      modal.open();
    } else if (newNetwork === "solana" && !hasSolanaWalletConnected) {
      toast.info(
        "Solana wallet not connected. Please connect to interact with the Solana presale."
      );
      modal.open(); // Consider modal.open({ network: 'solana' }) if supported by appkit modal
    }
  };

  const signReferralCode = async (referralCode: string) => {
    if (
      !(
        (
          isConnected && // This is now from appkitAccounts
          currentWalletType === "solana" &&
          walletAddress && // This is now from appkitAccounts
          appKitState.connector?.provider
        ) // Use appKitState directly for connector
      )
    ) {
      toast.error("Solana wallet not connected or provider not available.");
      modal.open();
      return null;
    }

    try {
      const { signReferralWithSolana } = await import("@/lib/referral-signer");
      // currentConnector is now from appKitState and typed by AppKitStateShape
      const solanaProvider = appKitState.connector.provider as any;

      if (
        !solanaProvider ||
        typeof solanaProvider.sendTransaction !== "function"
      ) {
        toast.error(
          "Solana wallet provider does not support sendTransaction or is not available."
        );
        return null;
      }

      // walletAddress is now from appKitState and typed by AppKitStateShape
      if (!walletAddress) {
        toast.error("Solana wallet address not available.");
        return null;
      }
      const solanaPublicKey = new PublicKey(walletAddress);

      const walletApiForSigning = {
        publicKey: solanaPublicKey,
        sendTransaction: async (
          transaction: Transaction,
          connection: Connection,
          options?: SendOptions
        ) => {
          const signature = await solanaProvider.sendTransaction(
            transaction,
            connection,
            options
          );
          return typeof signature === "string"
            ? signature
            : signature.signature;
        },
      };

      // Corrected to 2 arguments for signReferralWithSolana
      const signedReferral = await signReferralWithSolana(
        referralCode,
        walletApiForSigning
      );

      if (signedReferral) {
        toast.success("Referral code signed successfully");
        return signedReferral;
      }
    } catch (error) {
      console.error("Error signing referral code:", error);
      toast.error("Failed to sign referral code");
    }
    return null;
  };

  return {
    isLoading,
    isBuying,
    presaleNetwork,
    presaleStatus,
    bscStatus,
    solanaStatus,
    tokenAmount,
    userPurchasedTokens,
    hasConnectedWallet,
    hasBscWalletConnected,
    hasSolanaWalletConnected,
    walletAddress,
    currentWalletType,
    connected: isConnected,
    connectWallet: () => modal.open(), // Open default modal view
    setTokenAmount,
    buyTokens,
    switchNetwork,
    signReferralCode,
    cryptoPrices,
    estimatedCost,
    isLoadingPrices,
    hardcap,
    loadCryptoPrices,
    max,

    min,
    soldTokens,
    totalRaised,
    percentageSold,
    calculateTokensFromCrypto,
    lmxPriceUsd: LMX_PRICE_USD,
    refreshData: async () => {
      setIsLoading(true);
      toast.info("Refreshing presale data...");
      await Promise.all([
        loadSolanaPresaleStatus(), // Add Solana status refresh
        loadCryptoPrices(true),
      ]);
      toast.success("Presale data refreshed");
      setIsLoading(false);
    },
  };
}
