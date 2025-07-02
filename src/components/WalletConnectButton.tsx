"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  useAppKitState,
  useAppKitNetwork,
  useAppKitAccount,
} from "@reown/appkit/react";
import { modal } from "@/components/providers/wallet-provider";
import { useSession, signOut } from "next-auth/react";

import { Button } from "./ui/button";
import { Wallet, ChevronDown, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface WalletConnectProps {
  className?: string;
  variant?: "default" | "fancy" | "minimal";
  onConnect?: (walletType: "ethereum" | "solana" | "bsc") => void; // This might need re-evaluation based on how AppKit reports wallet type
}

export const WalletConnectButton: React.FC<WalletConnectProps> = ({
  className,
  variant = "fancy",
  onConnect,
}) => {
  const appKitState = useAppKitState();
  const { caipNetwork, chainId: networkChainId } = useAppKitNetwork();
  const { isConnected, address, allAccounts } = useAppKitAccount();
  const { data: session, status, update } = useSession();

  // Check if there are connected accounts
  const hasConnectedAccounts = allAccounts && allAccounts.length > 0;
  const isWalletConnected = isConnected && hasConnectedAccounts;

  // Use chainId from either network or state for backward compatibility
  const chainId = networkChainId;

  const [userId, setUserId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle automatic user registration when wallet connects
  const getWalletType = useCallback(():
    | "ethereum"
    | "solana"
    | "bsc"
    | "unknown" => {
    // Check if we're connected first
    if (!isConnected) return "unknown";

    // Check for Solana wallet
    if (
      chainId === "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" ||
      appKitState.selectedNetworkId?.toString().startsWith("solana:")
    ) {
      return "solana";
    }

    // Check chainId for EVM/BSC networks
    if (typeof chainId === "number" && (chainId === 56 || chainId === 97)) {
      return "bsc";
    }

    // Check for EVM connector indicators
    if (appKitState.selectedNetworkId?.toString().startsWith("eip155:")) {
      return "ethereum";
    }

    return "unknown"; // Default or if specific checks fail
  }, [isConnected, chainId, appKitState.selectedNetworkId]);

  useEffect(() => {
    // Determine wallet type using the improved logic
    const registerUserWithWallet = async () => {
      if (isConnected && address) {
        try {
          const walletType = getWalletType();
          if (
            walletType === "solana" ||
            walletType === "ethereum" ||
            walletType === "bsc"
          ) {
            // Track previous userId to detect if accounts were merged
            const prevUserId = userId;

            // Call API to register the user - this now handles account merging
            const response = await fetch("/api/user/auto-register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address,
                walletType,
              }),
            });

            const data = await response.json();

            if (response.ok) {
              setUserId(data.userId);
              console.log(`User registered/retrieved: ${data.userId}`);

              // Create a NextAuth session for this user
              if (data.userId) {
                console.log("Creating NextAuth session for wallet user");
                // Force session creation even if status shows "authenticated" but session data is missing
                const needsSession =
                  status !== "authenticated" || !session?.user?.id;

                if (needsSession) {
                  update({
                    user: {
                      ...session?.user,
                      walletAddress: address,
                      walletType,
                      walletVerified: true,
                      ...(walletType === "solana"
                        ? { solanaAddress: address, solanaVerified: true }
                        : {}),
                      ...(walletType === "ethereum" || walletType === "bsc"
                        ? { evmAddress: address, evmVerified: true }
                        : {}),
                    },
                  });
                  console.log("NextAuth session created successfully");

                  // Refresh the session data to get the updated user data
                }
              }

              // Check if accounts were merged based on response data
              if (data.accountsMerged && data.mergeInfo?.wasMerged) {
                // Display a more detailed notification about the merge
                const purchasesText =
                  data.mergeInfo.purchases > 0
                    ? `${data.mergeInfo.purchases} purchase${
                        data.mergeInfo.purchases !== 1 ? "s" : ""
                      }, `
                    : "";
                const bonusesText =
                  data.mergeInfo.bonuses > 0
                    ? `${data.mergeInfo.bonuses} bonus${
                        data.mergeInfo.bonuses !== 1 ? "es" : ""
                      }, `
                    : "";
                const referralsText =
                  data.mergeInfo.referrals > 0
                    ? `${data.mergeInfo.referrals} referral${
                        data.mergeInfo.referrals !== 1 ? "s" : ""
                      }`
                    : "";

                // Construct description with available data
                const activityText = [purchasesText, bonusesText, referralsText]
                  .filter((text) => text.length > 0)
                  .join("");

                const description =
                  activityText.length > 0
                    ? `Your wallet addresses have been linked to a single account with ${activityText.replace(
                        /, $/,
                        ""
                      )}`
                    : `Your wallet addresses have been linked to a single account`;

                toast.success("Accounts merged successfully!", {
                  description,
                  duration: 7000,
                });
              }
            }
          }
        } catch (error) {
          console.error("Failed to auto-register user:", error);
          toast.error("Failed to register wallet", {
            description: "Please try reconnecting your wallet",
          });
        }
      }
    };

    if (isClient && isConnected && address) {
      registerUserWithWallet();
    }
  }, [
    isConnected,
    update,
    userId,
    address,
    isClient,
    status,
    getWalletType,
    session?.user,
  ]);

  const getDisplayAddress = useCallback(() => {
    if (isConnected && address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return null;
  }, [isConnected, address]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentWalletType = getWalletType();

  // Previous connection state for toast notifications
  const [prevConnected, setPrevConnected] = useState<boolean | null>(null);
  const [prevAddress, setPrevAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient) return; // Ensure client-side only

    if (prevConnected === null) {
      setPrevConnected(isConnected);
      if (isConnected && address) setPrevAddress(address);
      return;
    }

    if (isConnected && address && (!prevConnected || address !== prevAddress)) {
      const walletType = getWalletType();
      if (onConnect && (walletType === "ethereum" || walletType === "solana")) {
        onConnect(walletType);
      }
      toast.success(
        `${walletType === "solana" ? "Solana" : "BSC/EVM"} wallet connected`,
        {
          description: `Address: ${getDisplayAddress()}`,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        }
      );
    } else if (!isConnected && prevConnected) {
      const walletType = getWalletType(); // Get type even on disconnect if possible

      // Sign out from NextAuth when wallet is disconnected
      if (status === "authenticated") {
        signOut({ redirect: false })
          .then(() => {
            console.log("Signed out from NextAuth after wallet disconnect");
          })
          .catch((error) => {
            console.error("Failed to sign out after wallet disconnect:", error);
          });
      }

      toast.info(
        `${walletType === "solana" ? "Solana" : "BSC/EVM"} wallet disconnected`
      );
    }

    setPrevConnected(isConnected);
    if (isConnected && address) setPrevAddress(address as string);
    else setPrevAddress(null);
  }, [
    isConnected,
    getDisplayAddress,
    getWalletType,
    address,
    onConnect,
    isClient,
    prevConnected,
    prevAddress,
    chainId,
    status,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const handleConnect = () => {
    modal.open(); // Open AppKit's modal
  };

  const handleDisconnect = async () => {
    try {
      console.log("Disconnecting wallet and signing out of NextAuth...");
      setShowOptions(false);

      // First sign out from NextAuth to clear the session
      if (status === "authenticated") {
        console.log("Signing out from NextAuth");
        await signOut({ redirect: false });
        console.log("Successfully signed out from NextAuth");
      } else {
        console.log("No active NextAuth session to sign out from");
      }

      // Then disconnect the wallet
      if (modal.disconnect) {
        console.log("Disconnecting wallet via AppKit");
        await modal.disconnect();
        console.log("Wallet successfully disconnected");

        // Clear local user state
        setUserId(null);

        // Show success message
        toast.success("Wallet disconnected", {
          description: "You have been signed out successfully",
        });
      } else {
        console.warn("Disconnect function not available on modal instance.");
        toast.error("Disconnect functionality not available.");
        return;
      }
    } catch (error) {
      console.error("Error during disconnect process:", error);
      toast.error("Failed to disconnect wallet", {
        description: "Please try again or refresh the page.",
      });
    }
  };

  const displayAddress = getDisplayAddress();

  // Get specific network name based on chainId
  const getNetworkName = () => {
    if (currentWalletType === "solana") {
      return "SOL";
    } else if (currentWalletType === "ethereum") {
      // Determine specific EVM network
      if (typeof chainId === "number") {
        if (chainId === 56) return "BSC";
        if (chainId === 97) return "BSC Testnet";
        if (chainId === 8453) return "Base";
        if (chainId === 1) return "ETH";
      }
      return "BSC";
    }
    return "";
  };

  const walletTypeDisplay = getNetworkName();

  return (
    <>
      <div className={cn("relative", className)}>
        <Button
          variant={
            variant === "fancy"
              ? "default"
              : variant === "minimal"
                ? "ghost"
                : "outline"
          }
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            variant === "fancy" &&
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-none",
            variant === "minimal" &&
              "bg-transparent hover:bg-black/20 text-white px-2 py-1 h-auto",
            variant === "default" &&
              "bg-black/50 backdrop-blur-sm border-white/10 text-white",
            className
          )}
          onClick={() =>
            isClient && isConnected
              ? setShowOptions(!showOptions)
              : handleConnect()
          }
        >
          {!isClient ? ( // Initial render before client check
            <>
              <Wallet size={variant === "minimal" ? 14 : 16} />
              {variant !== "minimal" && <span>Connect</span>}
            </>
          ) : isConnected ? (
            <>
              <Wallet size={variant === "minimal" ? 14 : 16} />
              {variant !== "minimal" && <span>Connected</span>}
              {variant !== "minimal" && walletTypeDisplay && (
                <div
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    currentWalletType === "solana"
                      ? "bg-purple-500/20"
                      : "bg-amber-500/20"
                  )}
                >
                  {walletTypeDisplay}
                </div>
              )}
            </>
          ) : (
            <>
              <Wallet size={variant === "minimal" ? 14 : 16} />
              {variant !== "minimal" && <span>Connect</span>}
            </>
          )}
          {isClient && isConnected && variant !== "minimal" && (
            <ChevronDown size={12} className="ml-1 opacity-70" />
          )}
        </Button>

        {isClient && showOptions && isConnected && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 right-0 bg-black/70 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg p-2 z-50 min-w-[220px] animate-in fade-in slide-in-from-top-5 duration-200"
          >
            <div className="flex flex-col gap-1">
              <div className="p-2 mb-1 text-sm font-medium text-primary border-b border-primary/20">
                Connected Wallet ({walletTypeDisplay})
              </div>
              <div className="px-2 py-1 text-xs text-white/60">
                Status:{" "}
                {status === "authenticated" ? (
                  <span className="text-green-500">Authenticated</span>
                ) : (
                  <span className="text-amber-500">{status}</span>
                )}
              </div>

              {displayAddress && (
                <div className="p-2 text-xs border-b border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        currentWalletType === "solana"
                          ? "bg-green-500"
                          : "bg-amber-500"
                      )}
                    ></div>
                    <div className="text-white/80 font-medium">
                      {currentWalletType === "solana" ? "Solana" : "BSC/EVM"}
                    </div>
                  </div>
                  <div className="font-mono bg-black/60 p-2 rounded text-xs overflow-hidden text-ellipsis text-white/90">
                    {displayAddress}
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-start gap-2 hover:bg-red-500/10 text-red-400 mt-1"
                onClick={handleDisconnect}
              >
                <X size={14} />
                <span>Disconnect</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
