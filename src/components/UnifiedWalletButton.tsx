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
  const [showTrustWalletPrompt, setShowTrustWalletPrompt] = useState(false);
  const [connectionTimeout, setConnectionTimeout] =
    useState<NodeJS.Timeout | null>(null);

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
      setShowTrustWalletPrompt(false);
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
    // Reset local state when opening the modal
    setIsModalOpened(false);
    modal.open();

    // Clear any existing timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // Set timeout to show Trust Wallet prompt if not connected within 3 seconds
    if (!isConnected) {
      const timeout = setTimeout(() => {
        setShowTrustWalletPrompt(true);
      }, 3000);
      setConnectionTimeout(timeout);
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

  // Handle Trust Wallet prompt close
  const handleTrustWalletPromptClose = () => {
    setShowTrustWalletPrompt(false);
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
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
        }`}
        onClick={buttonContent.onClick}
      >
        {buttonContent.icon}
        {variant !== "minimal" && (
          <span className={size === "sm" ? "text-xs" : ""}>
            {buttonContent.text}
          </span>
        )}
      </Button>

      {/* Trust Wallet Prompt Modal */}
      <Dialog
        open={showTrustWalletPrompt}
        onOpenChange={handleTrustWalletPromptClose}
      >
        <DialogContent className="bg-black border border-white/10 text-white max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-center mb-2">
              🚀 Join the Litmex Token Presale now!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-300">
              Tap this link to open the presale page directly in Trust Wallet's
              browser for smooth wallet connection and token purchase:
            </p>
            <Button
              onClick={() => {
                window.open(
                  "https://link.trustwallet.com/open_url?coin_id=20000714&url=https://litmexpresale.com",
                  "_blank"
                );
                handleTrustWalletPromptClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              <ExternalLink size={16} className="mr-2" />
              Open in Trust Wallet
            </Button>
            <p className="text-xs text-gray-400">
              📱 Make sure to open it on your mobile outside of Trust Wallet
            </p>
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
