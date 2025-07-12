"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Wallet, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import {
  useAppKitAccount,
  useAppKitState,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { modal } from "@/components/providers/wallet-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { SolanaWalletPrompt } from "./SolanaWalletPrompt";
import { getCookie, setCookie } from "@/lib/cookies";

interface UnifiedWalletButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "minimal";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UnifiedWalletButton({
  variant = "outline",
  size = "sm",
  className = "",
}: UnifiedWalletButtonProps) {
  const { data: session, status, update } = useSession();
  const { isConnected, address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const appKitState = useAppKitState();
  const [showSolanaVerificationModal, setShowSolanaVerificationModal] =
    useState(false);
  const [showBSCVerificationModal, setShowBSCVerificationModal] =
    useState(false);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [showMobileWalletPrompt, setShowMobileWalletPrompt] = useState(false);
  const [connectionTimeout, setConnectionTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const urlParams = new URLSearchParams(window.location.search);
  const wallet = urlParams.get("wallet");
  const isWallet = getCookie("wallet") === "true";
  const referrerCode = urlParams.get("ref") || getCookie("referralCode");
  useEffect(() => {
    if (isWallet) return;
    // If a specific wallet is requested via URL, handle it
    if (wallet) {
      setCookie("wallet", "true");
    }
  }, [wallet]);

  // Mobile detection
  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  };

  // Check if already in wallet browser
  const isInWalletBrowser = () => {
    if (typeof window === "undefined") return false;
    // const userAgent = navigator.userAgent.toLowerCase();
    return isWallet;
    // return (
    //   userAgent.includes("trustwallet") ||
    //   userAgent.includes("metamask") ||
    //   userAgent.includes("phantom")
    // );
  };

  // Determine wallet state
  const isAuthenticated = status === "authenticated";
  const hasAddress = !!address;
  const hasSolanaAddress = !!session?.user?.solanaAddress;
  const hasEvmAddress = !!session?.user?.evmAddress;
  const isOnBscNetwork = chainId === 56;

  const needsSolanaVerification =
    isAuthenticated && hasAddress && !hasSolanaAddress && !isOnBscNetwork;
  const needsBSCVerification =
    isAuthenticated && hasAddress && !hasEvmAddress && isOnBscNetwork;

  useEffect(() => {
    if (status === "unauthenticated") {
      modal.disconnect();
    }
  }, [status]);

  // Effect to handle AppKit modal state changes
  useEffect(() => {
    if (appKitState?.open) {
      setIsModalOpened(true);
    } else if (isModalOpened && !appKitState?.open && isConnected) {
      // AppKit modal was closed and wallet is now connected but may need verification
      setIsModalOpened(false);

      if (isAuthenticated) {
        // Wait a moment for connection to settle before showing verification modal
        setTimeout(() => {
          // Show the appropriate verification modal based on the network
          if (!hasSolanaAddress) {
            setShowSolanaVerificationModal(true);
          }
        }, 500);
      }
    } else if (!appKitState?.open) {
      setIsModalOpened(false);
    }
  }, [
    appKitState?.open,
    isConnected,
    hasSolanaAddress,
    isAuthenticated,
    isModalOpened,
  ]);

  // Effect to prompt for verification when wallet is connected but not verified
  useEffect(() => {
    // Auto-show verification when wallet connected but not verified
    if (isAuthenticated && isConnected && hasAddress && !appKitState?.open) {
      // For Solana verification
      if (
        needsSolanaVerification &&
        !showSolanaVerificationModal &&
        !localStorage.getItem("skipWalletPrompt")
      ) {
        const timerSolana = setTimeout(() => {
          setShowSolanaVerificationModal(true);
        }, 1000);
        return () => clearTimeout(timerSolana);
      }

      // For BSC verification
      if (
        needsBSCVerification &&
        !showBSCVerificationModal &&
        !localStorage.getItem("skipBSCWalletPrompt")
      ) {
        const timerBSC = setTimeout(() => {
          setShowBSCVerificationModal(true);
        }, 1000);
        return () => clearTimeout(timerBSC);
      }
    }
  }, [
    isAuthenticated,
    isConnected,
    hasAddress,
    needsSolanaVerification,
    needsBSCVerification,
    hasSolanaAddress,
    hasEvmAddress,
    showSolanaVerificationModal,
    showBSCVerificationModal,
    appKitState?.open,
  ]);

  // Effect to monitor connection status and show Trust Wallet prompt
  useEffect(() => {
    if (isConnected && connectionTimeout) {
      // Clear timeout if wallet gets connected
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
  }, [isConnected, connectionTimeout]);

  // Display address helper
  const getDisplayAddress = () => {
    if (address) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return null;
  };

  const handleConnect = () => {
    // On mobile, show wallet selection first unless already in wallet browser
    if (isMobile() && !isInWalletBrowser()) {
      setShowMobileWalletPrompt(true);
      return;
    }

    // Reset local state when opening the modal
    setIsModalOpened(false);
    modal.open();

    // Clear any existing timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
  };

  const handleVerifyWallet = () => {
    // Remove any previously set skip flags before showing the modal
    localStorage.removeItem("skipWalletPrompt");
    localStorage.removeItem("skipBSCWalletPrompt");

    // Show appropriate verification modal based on the network
    if (isOnBscNetwork) {
      setShowBSCVerificationModal(true);
    } else {
      setShowSolanaVerificationModal(true);
    }
  };

  // Handle Solana modal close and refresh session if needed
  const handleSolanaVerificationModalChange = (isOpen: boolean) => {
    setShowSolanaVerificationModal(isOpen);
    if (!isOpen && hasSolanaAddress !== !!session?.user?.solanaAddress) {
      // If modal was closed and the verification status might have changed, refresh the session
      update();
    }
  };

  // Handle BSC modal close and refresh session if needed
  const handleBSCVerificationModalChange = (isOpen: boolean) => {
    setShowBSCVerificationModal(isOpen);
    if (!isOpen && hasEvmAddress !== !!session?.user?.evmAddress) {
      // If modal was closed and the verification status might have changed, refresh the session
      update();
    }
  };

  // Handle mobile wallet selection
  const handleWalletSelection = (
    walletType: "trustwallet" | "metamask" | "phantom"
  ) => {
    const currentUrl = window.location.href;
    let deepLink = "";

    switch (walletType) {
      case "trustwallet":
        deepLink = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(currentUrl)}?wallet=true${referrerCode ? `&ref=${referrerCode}` : ""}`;
        break;
      case "metamask":
        deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}?wallet=true${referrerCode ? `&ref=${referrerCode}` : ""}`;
        break;
      case "phantom":
        deepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=https%3A%2F%2F${window.location.host}&wallet=true${referrerCode ? `&ref=${referrerCode}` : ""}`;
        break;
    }

    // Try to open the deeplink
    window.open(deepLink, "_blank");

    // Close the modal after a delay
    setTimeout(() => {
      setShowMobileWalletPrompt(false);
    }, 1000);
  };

  // Proceed with connection if already in wallet browser
  const handleProceedToConnect = () => {
    setShowMobileWalletPrompt(false);
    // Reset local state when opening the modal
    setIsModalOpened(false);
    modal.open();
  };

  // Determine button appearance and behavior
  const getButtonContent = () => {
    // Not authenticated at all
    if (!isAuthenticated) {
      return {
        text: "Connect",
        icon: <Wallet size={16} className="mr-1.5" />,
        onClick: handleConnect,
        variant: variant,
        style: "",
      };
    }

    // If wallet is connected but needs verification
    if (isConnected && hasAddress) {
      // BSC wallet connected but not verified
      // if (isOnBscNetwork && !hasEvmAddress) {
      //   return {
      //     text: "Verify BSC Wallet",
      //     icon: <AlertTriangle size={16} className="mr-1.5 text-amber-400" />,
      //     onClick: handleVerifyWallet,
      //     variant: "outline",
      //     style:
      //       "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300",
      //   };
      // }

      // Solana wallet connected but not verified
      if (!isOnBscNetwork && !hasSolanaAddress) {
        return {
          text: "Verify Solana Wallet",
          icon: <AlertTriangle size={16} className="mr-1.5 text-amber-400" />,
          onClick: handleVerifyWallet,
          variant: "outline",
          style:
            "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300",
        };
      }
    }

    // If wallet is verified (either Solana or EVM)
    if ((hasSolanaAddress && isConnected) || (hasEvmAddress && isConnected)) {
      return {
        text: getDisplayAddress() || "Connected",
        icon: <CheckCircle size={16} className="mr-1.5 text-green-400" />,
        onClick: handleConnect, // Allow changing wallet even when verified
        variant: "outline",
        style:
          "border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-300",
      };
    }

    // Default: authenticated but wallet not connected
    return {
      text: "Connect Wallet",
      icon: <Wallet size={16} className="mr-1.5" />,
      onClick: handleConnect,
      variant: "outline",
      style: "",
    };
  };

  const buttonContent = getButtonContent();

  return (
    <>
      <Button
        variant={
          variant === "minimal" ? "ghost" : (buttonContent.variant as any)
        }
        size={size}
        className={`${buttonContent.style} ${className} ${
          variant === "minimal" ? "p-1.5 h-auto" : ""
        } bg-[#AD00FF] text-white font-medium flex items-center justify-center gap-2`}
        onClick={buttonContent.onClick}
      >
        {buttonContent.icon}
        {variant !== "minimal" && (
          <span className={size === "sm" ? "text-xs" : ""}>
            {buttonContent.text}
          </span>
        )}
      </Button>

      {/* Mobile Wallet Selection Modal */}
      <Dialog
        open={showMobileWalletPrompt}
        onOpenChange={setShowMobileWalletPrompt}
      >
        <DialogContent className="bg-black border border-white/10 text-white max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-center mb-2">
              Choose Your Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isInWalletBrowser() ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-300">
                  You're already in a wallet browser! You can proceed to
                  connect.
                </p>
                <Button
                  onClick={handleProceedToConnect}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                >
                  <Wallet size={16} className="mr-2" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-300 text-center mb-4">
                  Select a wallet to open and connect:
                </p>
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => handleWalletSelection("trustwallet")}
                    variant="outline"
                    className="w-full h-16 border-white/20 bg-transparent hover:bg-white/5 text-white font-medium flex items-center justify-start px-4"
                  >
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img
                        src="/icons/wallets/trust-wallet.png"
                        alt="Trust Wallet"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233375BB'><rect width='24' height='24' rx='4' fill='%233375BB'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold' fill='white'>T</text></svg>";
                        }}
                      />
                    </div>
                    <span className="flex-1 text-center">Trust Wallet</span>
                  </Button>

                  <Button
                    onClick={() => handleWalletSelection("metamask")}
                    variant="outline"
                    className="w-full h-16 border-white/20 bg-transparent hover:bg-white/5 text-white font-medium flex items-center justify-start px-4"
                  >
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img
                        src="/icons/wallets/metamask.svg"
                        alt="MetaMask"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='%23f6851b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold' fill='white'>M</text></svg>";
                        }}
                      />
                    </div>
                    <span className="flex-1 text-center">MetaMask</span>
                  </Button>

                  <Button
                    onClick={() => handleWalletSelection("phantom")}
                    variant="outline"
                    className="w-full h-16 border-white/20 bg-transparent hover:bg-white/5 text-white font-medium flex items-center justify-start px-4"
                  >
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img
                        src="/icons/wallets/phantom.svg"
                        alt="Phantom"
                        className="w-8 h-8 object-contain rounded-full"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='12' fill='%23551bbf'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' font-weight='bold' fill='white'>P</text></svg>";
                        }}
                      />
                    </div>
                    <span className="flex-1 text-center">Phantom</span>
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={handleProceedToConnect}
                    variant="outline"
                    className="w-full border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Skip & Connect Directly
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Solana Wallet Verification Modal */}
      <Dialog
        open={showSolanaVerificationModal}
        onOpenChange={handleSolanaVerificationModalChange}
      >
        <DialogContent className="bg-black border border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="text-lg font-medium">
              Verify Your Solana Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <SolanaWalletPrompt
              isModal={showSolanaVerificationModal}
              onVerificationComplete={() =>
                setShowSolanaVerificationModal(false)
              }
              noDismiss={true} // Prevent dismissing the modal until verification is complete
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* BSC Wallet Verification Modal */}
      {/* <Dialog
        open={showBSCVerificationModal}
        onOpenChange={handleBSCVerificationModalChange}
      >
        <DialogContent className="bg-black border border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="text-lg font-medium">
              Verify Your BSC Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <BSCWalletPrompt
              isModal={showSolanaVerificationModal}
              onVerificationComplete={() => setShowBSCVerificationModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
