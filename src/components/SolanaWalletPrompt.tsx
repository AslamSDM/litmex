"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { modal } from "@/components/providers/wallet-provider";
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
} from "@reown/appkit/react";
import { toast } from "sonner";
import { createSignMessage } from "@/lib/wallet-auth";
import bs58 from "bs58";
import { AppKitStateShape } from "@/components/hooks/usePresale";

// Define error types for better handling
const ERROR_TYPES = {
  CONNECTION_FAILED: "Failed to connect wallet",
  SIGNATURE_REJECTED: "Signature request was rejected",
  WALLET_INCOMPATIBLE: "Your wallet is not compatible with this application",
  VERIFICATION_FAILED: "Failed to verify wallet ownership",
  SERVER_ERROR: "Server error occurred",
  TIMEOUT_ERROR: "Operation timed out",
  WRONG_NETWORK: "Wrong network selected",
};

interface SolanaWalletPromptProps {
  isModal?: boolean;
  onVerificationComplete?: () => void;
  noDismiss?: boolean; // Added noDismiss prop to control dismiss button visibility
}

export function SolanaWalletPrompt({
  isModal = false,
  onVerificationComplete,
  noDismiss = false, // Added noDismiss prop to control dismiss button visibility
}: SolanaWalletPromptProps) {
  const { data: session, update } = useSession();
  const [isVisible, setIsVisible] = useState(isModal || false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [hasInitiatedSignRequest, setHasInitiatedSignRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const router = useRouter();

  // AppKit hooks for wallet interaction
  const { isConnected, address } = useAppKitAccount();
  const { caipNetwork, chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<any>("solana");

  const appKitState = useAppKitState() as AppKitStateShape;

  // Check if user is on BSC network instead of Solana
  const isOnBscNetwork = chainId === 56;

  useEffect(() => {
    // If it's a modal component, visibility is controlled by parent
    if (isModal) return;

    // Otherwise automatically show for users without verified wallet
    if (
      session?.user &&
      !session.user.solanaAddress &&
      !localStorage.getItem("skipWalletPrompt")
    ) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 15000); // Show after 1.5 seconds to avoid immediate popup

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [session, isModal]);

  // Effect to handle wallet connection status changes - completely disable automatic signature requests
  useEffect(() => {
    if (isConnected && address) {
      // Only check network status - no automatic signature requests
      if (isOnBscNetwork) {
        setError(ERROR_TYPES.WRONG_NETWORK);
        setErrorCode("WRONG_NETWORK");
      } else {
        // Clear any network-related errors
        setError(null);
        setErrorCode(null);
      }
    }
  }, [isConnected, address, isOnBscNetwork]);

  // Function to request signature to verify wallet ownership
  const handleSignatureRequest = async () => {
    // Don't proceed if wallet isn't connected, address is missing, or signing is already in progress
    if (!isConnected || !address || isSigningMessage) return;

    // Prevent multiple signature requests
    setHasInitiatedSignRequest(true);

    try {
      setIsSigningMessage(true);
      setError(null);
      setErrorCode(null);

      // Create a message to sign that includes a timestamp and nonce to prevent replay attacks
      const signatureMessage = createSignMessage(address);

      // Get the provider from AppKit state
      let signatureBase58: string | undefined;

      if (!walletProvider) {
        // Fallback for testing/development
        console.log(appKitState);
        // if (process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true") {
        //   toast.warning("No wallet provider detected - using test mode");
        //   signatureBase58 = `TEST_${Date.now().toString(36)}`;
        // } else {
        //   throw new Error(ERROR_TYPES.WALLET_INCOMPATIBLE);
        // }
        throw new Error(ERROR_TYPES.WALLET_INCOMPATIBLE);
      } else {
        try {
          // Implement signing with timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error(ERROR_TYPES.TIMEOUT_ERROR)),
              30000
            ); // 30 second timeout
          });

          // Get the provider from AppKit state
          const provider = walletProvider;

          // Create a promise for the signing process
          const signingPromise = (async () => {
            // Try standard signMessage first
            if (typeof provider.signMessage === "function") {
              console.log("fn1");

              const messageBytes = new TextEncoder().encode(signatureMessage);
              const signature = await provider.signMessage(messageBytes);
              return typeof signature === "string"
                ? signature
                : bs58.encode(signature);
            } else {
              throw new Error(ERROR_TYPES.WALLET_INCOMPATIBLE);
            }
          })();

          // Race the signing promise against the timeout
          signatureBase58 = await Promise.race([
            signingPromise,
            timeoutPromise,
          ]);
        } catch (signError: any) {
          // Special handling for test mode if browser extension has issues
          console.warn("Error during wallet signing:", signError);

          if (process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true") {
            toast.warning("Wallet signing failed - using test mode");
            signatureBase58 = `TEST_${Date.now().toString(36)}`;
          } else if (signError.message?.includes("User rejected")) {
            throw new Error(ERROR_TYPES.SIGNATURE_REJECTED);
          } else {
            throw signError;
          }
        }
      }

      // Verify the wallet with the backend
      if (session?.user?.id && signatureBase58) {
        // Register and verify the wallet with the signature
        const response = await fetch("/api/auth/verify-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: address,
            walletType: "solana",
            userId: session.user.id,
            signature: signatureBase58,
            message: signatureMessage,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Create a NextAuth session with the wallet info
          if (data.userId) {
            // await createWalletSession(data.userId, address as string, "solana");

            // Display success message
            toast.success("Wallet verified successfully!", {
              description:
                "You can now participate in the presale and earn referral rewards.",
            });

            // Call the onVerificationComplete callback if it exists
            if (onVerificationComplete) {
              // Give a moment for the UI to show success state
              update({
                user: {
                  ...session.user,
                  solanaAddress: address,
                },
              });
              setTimeout(() => {
                onVerificationComplete();
              }, 1500);
            } else {
              // If no callback, update UI to show success state
              setIsSigningMessage(false);
              // Only reload if callback isn't provided, after showing success message
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          }
        } else {
          // Get error details from response
          setErrorCode(data.code || "UNKNOWN_ERROR");
          throw new Error(data.error || ERROR_TYPES.VERIFICATION_FAILED);
        }
      }
    } catch (err: any) {
      console.error("Error during wallet verification:", err);
      setError(err.message || ERROR_TYPES.VERIFICATION_FAILED);

      // Show appropriate toast based on error type
      if (err.message.includes(ERROR_TYPES.SIGNATURE_REJECTED)) {
        toast.error("Signature request rejected", {
          description:
            "You need to approve the signature request to verify your wallet",
        });
      } else if (err.message.includes(ERROR_TYPES.WALLET_INCOMPATIBLE)) {
        toast.error("Wallet incompatible", {
          description: "Please try using a different Solana wallet",
        });
      } else if (err.message.includes(ERROR_TYPES.TIMEOUT_ERROR)) {
        toast.error("Operation timed out", {
          description: "The wallet operation took too long. Please try again.",
        });
      } else {
        toast.error("Wallet verification failed", {
          description: err.message || "Please try again",
        });
      }
    } finally {
      setIsSigningMessage(false);
      setIsVisible(false);
    }
  };

  // Function to handle switching to Solana network
  const handleSwitchToSolana = async () => {
    try {
      setIsSwitchingNetwork(true);
      setError(null);
      setErrorCode(null);

      // Close current modal
      modal.close();

      // Open modal with specific parameters to switch to Solana
      setTimeout(() => {
        modal.open();
        // The user will need to manually switch to Solana in the modal
      }, 500);

      toast.info("Please switch to the Solana network", {
        description: "Switch to Solana to continue with wallet verification",
      });
    } catch (err: any) {
      console.error("Error switching network:", err);
      setError(err.message || ERROR_TYPES.WRONG_NETWORK);
      toast.error("Failed to switch network", {
        description:
          err.message || "Please try manually switching to Solana network",
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setErrorCode(null);

      // Open the AppKit modal to connect wallet
      modal.open();

      // The effect will handle signature request once connected
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || ERROR_TYPES.CONNECTION_FAILED);
      toast.error("Failed to connect wallet", {
        description: err.message || "Please try again",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Modified Verify Wallet button handler to explicitly trigger signature request
  const handleVerifyWallet = () => {
    if (isConnected && address && !isSigningMessage) {
      // Reset the flag if the user explicitly clicks to verify again
      setHasInitiatedSignRequest(false);
      handleSignatureRequest();
    }
  };

  // Function to dismiss the wallet prompt
  const handleDismiss = () => {
    setIsVisible(false);
    onVerificationComplete?.();
    // Save preference in localStorage to not show again in this session
    localStorage.setItem("skipWalletPrompt", "true");

    toast.info("Wallet verification skipped", {
      description: "You can verify your wallet later from your profile",
    });
  };

  // Get appropriate error message based on error code
  const getErrorMessage = () => {
    if (!error) return null;

    // Format specific error messages based on error code
    if (errorCode === "SIGNATURE_EXPIRED") {
      return "Your signature has expired. Please try again.";
    }

    return error;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${
        isModal
          ? "relative rounded-xl border border-gray-800 bg-black/95 p-4 sm:p-6 shadow-xl max-w-md mx-auto"
          : "fixed bottom-8 right-8 z-50 max-w-sm rounded-xl border border-gray-800 bg-black/80 p-6 shadow-xl backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white">
            Connect your Solana Wallet
          </h3>
        </div>
        {!noDismiss && (
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4">
        {isConnected ? (
          <div className="text-sm text-green-400 font-medium flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
            Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        ) : (
          <p className="text-sm text-gray-300">
            Connect your Solana wallet to participate in our presale and receive
            Trump tokens through referrals.
          </p>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
            {getErrorMessage()}
          </div>
        )}

        {isSigningMessage && (
          <div className="mt-2 text-sm text-blue-400 bg-blue-500/10 p-2 rounded-md flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Verifying wallet ownership...
          </div>
        )}

        {/* Show network switch message if on BSC */}
        {isConnected && isOnBscNetwork && (
          <div className="mt-3 text-sm bg-amber-500/10 text-amber-300 p-2 rounded-md border border-amber-500/30">
            <div className="flex items-center mb-1">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Wrong network detected
            </div>
            <p>
              You&apos;re currently on the BSC network, but this application
              requires Solana. Please switch networks to continue.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isConnected && isOnBscNetwork ? (
          <button
            onClick={handleSwitchToSolana}
            disabled={isSwitchingNetwork}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-medium text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 flex justify-center items-center"
          >
            {isSwitchingNetwork ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Switching Network...
              </>
            ) : (
              <>
                Switch to Solana Network
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 inline-block h-4 w-4"
                >
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"></path>
                </svg>
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={isConnecting || isSigningMessage || isSwitchingNetwork}
            >
              {isModal ? "Dismiss" : "Remind me later"}
            </button>
            <button
              onClick={
                isConnected
                  ? chainId == 1
                    ? () => {}
                    : handleVerifyWallet
                  : handleConnectWallet
              }
              disabled={isConnecting || isSigningMessage}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 flex justify-center items-center"
            >
              {isConnecting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </>
              ) : isSigningMessage ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </>
              ) : isConnected ? (
                chainId == 1 ? (
                  <>
                    <w3m-network-button />
                  </>
                ) : (
                  <>
                    Verify Wallet
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1 inline-block h-4 w-4"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </>
                )
              ) : (
                <>
                  Connect Wallet
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1 inline-block h-4 w-4"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Always show dismiss option when on BSC network */}
        {isConnected && isOnBscNetwork && (
          <button
            onClick={handleDismiss}
            className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={isSwitchingNetwork}
          >
            {isModal ? "Dismiss" : "Remind me later"}
          </button>
        )}
      </div>
    </div>
  );
}
