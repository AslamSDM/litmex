import { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { USDT_SPL_TOKEN_ADDRESS, BSC_USDT_ADDRESS } from "@/lib/constants";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { formatUnits, formatEther } from "viem";
import { useReadContract } from "wagmi";
import { ethers } from "ethers";

// ERC20 ABI for balance queries
const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export function useWalletBalances() {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [bnbBalance, setBnbBalance] = useState<number | null>(null);
  const [bscUsdtBalance, setBscUsdtBalance] = useState<number | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  // Check if we're on BSC or Solana
  const isSolana = chainId === "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
  const isBsc = chainId === 56;

  // Read BSC USDT balance
  const { data: bscUsdtBalanceData, refetch: refetchBscUsdtBalance } =
    useReadContract({
      address: BSC_USDT_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: isConnected && isBsc && !!address,
      },
    });

  // Update BSC USDT balance when data changes
  useEffect(() => {
    if (bscUsdtBalanceData) {
      // USDT on BSC has 18 decimals
      setBscUsdtBalance(Number(formatUnits(bscUsdtBalanceData as bigint, 18)));
    }
  }, [bscUsdtBalanceData]);

  // Fetch Solana balances
  const fetchSolanaBalances = async () => {
    if (!isConnected || !address || !isSolana) {
      setSolBalance(null);
      setUsdtBalance(null);
      return;
    }

    setIsLoadingBalances(true);

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://mainnet.helius-rpc.com/?api-key=c84ddc95-f80a-480a-b8b0-7df6d2fcc62f"
      );

      const publicKey = new PublicKey(address);

      // Get SOL balance
      const lamports = await connection.getBalance(publicKey);
      setSolBalance(lamports / LAMPORTS_PER_SOL);

      // Get USDT balance
      try {
        const usdtMint = new PublicKey(USDT_SPL_TOKEN_ADDRESS);
        const tokenAddress = await getAssociatedTokenAddress(
          usdtMint,
          publicKey
        );

        try {
          const tokenBalance =
            await connection.getTokenAccountBalance(tokenAddress);
          setUsdtBalance(Number(tokenBalance.value.uiAmount));
        } catch (error) {
          // If token account doesn't exist, balance is 0
          setUsdtBalance(0);
        }
      } catch (error) {
        console.error("Error fetching Solana USDT balance:", error);
        setUsdtBalance(0);
      }
    } catch (error) {
      console.error("Error fetching Solana balances:", error);
      setSolBalance(null);
      setUsdtBalance(null);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch BNB balance
  const fetchBscBalances = async () => {
    if (!isConnected || !address || !isBsc) {
      setBnbBalance(null);
      return;
    }

    setIsLoadingBalances(true);

    try {
      // For BNB balance, we can use the public RPC endpoint
      // For BNB balance, we can use ethers provider
      const provider = new ethers.JsonRpcProvider(
        "https://bsc-dataseed.binance.org/"
      );
      const balanceWei = await provider.getBalance(address as string);
      console.log("BNB Balance Wei:", balanceWei.toString());
      setBnbBalance(Number(formatEther(balanceWei)));

      // Also refresh USDT balance
      await refetchBscUsdtBalance();
    } catch (error) {
      console.error("Error fetching BNB balance:", error);
      setBnbBalance(null);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const fetchBalances = async () => {
    console.log("Fetching balances for address:", address, isSolana, isBsc);
    if (isSolana) {
      if (solBalance === null || usdtBalance === null) {
        await fetchSolanaBalances();
      }
    } else if (isBsc) {
      if (bnbBalance === null || bscUsdtBalance === null) {
        await fetchBscBalances();
      }
    }
  };
  // Fetch balances when wallet connection or network changes
  useEffect(() => {
    // Fetch balances based on current network
    if (isConnected && address) {
      fetchBalances();
    } else {
      // Reset all balances when disconnected
      setSolBalance(null);
      setUsdtBalance(null);
      setBnbBalance(null);
      setBscUsdtBalance(null);
    }
  }, [isConnected, address, chainId]);

  return {
    // Solana balances
    solBalance,
    usdtBalance,
    // BSC balances
    bnbBalance,
    bscUsdtBalance,
    isLoadingBalances,
    refreshBalances: fetchBalances,
  };
}
