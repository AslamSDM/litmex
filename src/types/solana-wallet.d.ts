interface SolanaProvider {
  publicKey: import("@solana/web3.js").PublicKey;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: import("@solana/web3.js").PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (
    transaction: import("@solana/web3.js").Transaction
  ) => Promise<import("@solana/web3.js").Transaction>;
  signAllTransactions: (
    transactions: import("@solana/web3.js").Transaction[]
  ) => Promise<import("@solana/web3.js").Transaction[]>;
  sendTransaction: (
    transaction: import("@solana/web3.js").Transaction,
    connection: import("@solana/web3.js").Connection
  ) => Promise<string>;
  lastTransaction?: string;
}

interface Window {
  solana?: SolanaProvider;
  phantom?: {
    solana?: SolanaProvider;
  };
}
