import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "./hooks/useTransactionStatus";
import TransactionStatusIndicator from "./TransactionStatusIndicator";
import { X, ExternalLink } from "lucide-react";

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  title?: string;
  transactionSignature?: string;
  network?: "bsc" | "solana";
}

const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  title = "Transaction Status",
  transactionSignature,
  network = "solana",
}) => {
  // Get explorer URL for the transaction
  const getExplorerUrl = () => {
    if (!transactionSignature) return "#";

    if (network === "solana") {
      // Use Solscan or Solana Explorer
      return `https://solscan.io/tx/${transactionSignature}${
        process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
          ? "?cluster=devnet"
          : ""
      }`;
    } else {
      // Use BscScan
      return `https://bscscan.com/tx/${transactionSignature}${
        process.env.NEXT_PUBLIC_BSC_TESTNET === "true" ? "?network=testnet" : ""
      }`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border border-primary/20 text-white max-w-md">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button> */}
        </DialogHeader>

        <TransactionStatusIndicator steps={status.steps} />

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          {status.isComplete && !status.isError && (
            <div className="text-center w-full text-sm text-green-400 mt-2">
              Transaction completed successfully!
            </div>
          )}

          {status.isError && (
            <div className="text-center w-full text-sm text-red-400 mt-2">
              Transaction encountered an error. Please try again or contact
              support.
            </div>
          )}

          <div className="flex justify-between w-full mt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              {status.isComplete || status.isError ? "Close" : "Cancel"}
            </Button>

            {transactionSignature && (status.isComplete || status.isError) && (
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                View on Explorer
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionStatusModal;
